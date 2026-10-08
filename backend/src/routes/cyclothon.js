const express = require("express");
const {
  parseSchema,
  registrationCreateSchema,
  cashfreePaymentVerifySchema,
  normalizeRegistrationInput,
} = require("../services/validation");
const { ValidationError, NotFoundError } = require("../errors");

function toRegistrationRead(registration) {
  return {
    id: registration.id,
    full_name: registration.full_name,
    ride_category: registration.ride_category,
    status: registration.status,
    created_at: registration.created_at,
  };
}

function createCyclothonRouter({
  config,
  repository,
  emailService,
  cashfreeService,
  rateLimiter,
}) {
  const router = express.Router();

  async function sendAndRecordRegistrationConfirmation(registration) {
    const settings = await repository.getSiteSettings();
    const sent = await emailService.sendRegistrationConfirmation({
      recipient: registration.email,
      registration,
      checkinQrPrefix: config.checkinQrPrefix,
      eventDate: settings.event_date,
      eventLocation: settings.event_location,
      eventStartTime: settings.event_start_time,
    });
    await repository.recordEmailDelivery({
      registrationId: registration.id,
      emailType: "registration_confirmation",
      recipient: registration.email,
      subject: "Your NV Cyclothon 2026 registration is confirmed",
      sent,
      status: config.emailEnabled ? (sent ? "sent" : "failed") : "disabled",
    });
  }

  router.get("/webhook/cashfree", (_req, res) => {
    res.status(200).json({ status: "ok", service: "cashfree-webhook" });
  });

  router.post("/webhook/cashfree", async (req, res) => {
    const signature = req.header("x-webhook-signature");
    const timestamp = req.header("x-webhook-timestamp");
    const rawBody = req.rawBody?.toString("utf8") || JSON.stringify(req.body || {});

    console.log("[Cashfree Webhook] Received:", {
      hasSignature: Boolean(signature),
      timestamp,
      type: req.body?.type || req.body?.event,
      isTest: Boolean(req.body?.test || req.header("x-webhook-test")),
    });

    if (!config.cashfreeEnabled) {
      res.status(404).json({ detail: "Not found" });
      return;
    }

    // Cashfree Dashboard "Test" button sends a connectivity verification ping
    const isTestPing =
      !signature ||
      req.body?.type === "TEST" ||
      req.body?.event === "TEST" ||
      req.header("x-webhook-test") === "true";

    if (isTestPing) {
      console.log("[Cashfree Webhook] Acknowledged test ping successfully.");
      res.status(200).json({ status: "ok", message: "Cashfree test ping acknowledged" });
      return;
    }

    if (!cashfreeService.verifyWebhook({
      signature,
      timestamp,
      rawBody,
    })) {
      console.warn("[Cashfree Webhook] Signature verification failed!");
      res.status(401).json({ detail: "Invalid webhook signature" });
      return;
    }

    const payment = req.body?.data?.payment;
    const order = req.body?.data?.order;
    if (req.body?.type === "PAYMENT_SUCCESS_WEBHOOK" && order?.order_id && payment?.cf_payment_id) {
      try {
        const updated = await repository.markCyclothonPaymentFromWebhook({
          orderId: order.order_id,
          paymentId: String(payment.cf_payment_id),
        });
        if (updated) {
          void sendAndRecordRegistrationConfirmation(updated);
        }
      } catch (err) {
        if (!(err instanceof NotFoundError)) {
          throw err;
        }
      }
    }
    res.status(200).json({ status: "ok" });
  });

  router.post(
    "/registrations",
    rateLimiter.middleware(
      "registration",
      5,
      3600,
      "Too many registration attempts. Try again in an hour."
    ),
    async (req, res) => {
      const settings = await repository.getSiteSettings();
      if (!settings.registration_open) {
        res.status(403).json({ detail: "Registration is currently closed" });
        return;
      }

      const parsed = parseSchema(registrationCreateSchema, req.body);
      const payload = normalizeRegistrationInput(parsed);
      if (!payload.waiver_accepted || !payload.privacy_accepted) {
        throw new ValidationError(
          "The rider waiver and privacy notice must be accepted"
        );
      }

      const result = await repository.createCyclothonRegistration(payload, {
        paymentEnabled: config.cashfreeEnabled,
        eventDate: settings.event_date,
        createPaymentOrder: ({ amountPaise, receipt, registration }) =>
          cashfreeService.createOrder({
            orderId: receipt,
            amountPaise,
            customer: {
              id: registration.id,
              name: registration.full_name,
              email: registration.email,
              phone: registration.phone,
            },
            returnUrl: `${config.publicSiteUrl}/register?payment=return&order_id={order_id}`,
            notifyUrl: `${config.publicApiUrl.replace(/\/api$/, "")}/api/cyclothon/webhook/cashfree`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          }),
      });

      if (!config.cashfreeEnabled) {
        void sendAndRecordRegistrationConfirmation(result.registration);
      }

      res.status(201).json({
        ...toRegistrationRead(result.registration),
        checkout: result.checkout,
      });
    }
  );

  router.post(
    "/registrations/:registrationId/payment/verify",
    rateLimiter.middleware(
      "payment-verify",
      20,
      900,
      "Too many payment verification attempts. Try again in 15 minutes."
    ),
    async (req, res) => {
    const registrationId = Number.parseInt(req.params.registrationId, 10);
    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      throw new ValidationError("Invalid registration id");
    }

    const payload = parseSchema(cashfreePaymentVerifySchema, req.body);
    const payment = await cashfreeService.getPaymentStatus(payload.order_id);
    if (payment.state !== "paid") {
      res.status(409).json({
        detail: payment.state === "pending"
          ? "Your payment is still being confirmed. Please wait a moment and retry."
          : "Payment was not completed. No registration has been confirmed.",
      });
      return;
    }

    const registration = await repository.verifyCyclothonPayment(
      registrationId,
      {
        order_id: payload.order_id,
        payment_id: payment.paymentId,
        signature: "cashfree-server-verified",
      },
      "cashfree-server-verified"
    );

    void sendAndRecordRegistrationConfirmation(registration);
    void emailService.sendPaymentReceipt({
      recipient: registration.email,
      name: registration.full_name,
      orderId: registration.id,
      totalPaise: registration.registration_fee_paise,
    });

    res.json(toRegistrationRead(registration));
  });

  router.post(
    "/registrations/verify-order",
    rateLimiter.middleware(
      "verify-order",
      20,
      900,
      "Too many payment verification attempts. Try again in 15 minutes."
    ),
    async (req, res) => {
      const payload = parseSchema(cashfreePaymentVerifySchema, req.body);
      const registration = await repository.getRegistrationByOrderId(payload.order_id);
      if (!registration) {
        throw new ValidationError("Registration not found for this order");
      }

      if (registration.payment_status === "paid") {
        res.json(toRegistrationRead(registration));
        return;
      }

      const payment = await cashfreeService.getPaymentStatus(payload.order_id);
      if (payment.state !== "paid") {
        res.status(409).json({
          detail: payment.state === "pending"
            ? "Your payment is still being confirmed. Please wait a moment and retry."
            : "Payment was not completed. No registration has been confirmed.",
        });
        return;
      }

      const updated = await repository.verifyCyclothonPayment(
        registration.id,
        {
          order_id: payload.order_id,
          payment_id: payment.paymentId,
          signature: "cashfree-server-verified",
        },
        "cashfree-server-verified"
      );

      void sendAndRecordRegistrationConfirmation(updated);
      void emailService.sendPaymentReceipt({
        recipient: updated.email,
        name: updated.full_name,
        orderId: updated.id,
        totalPaise: updated.registration_fee_paise,
      });

      res.json(toRegistrationRead(updated));
    }
  );

  router.get(
    "/registrations/by-order/:orderId",
    rateLimiter.middleware(
      "order-lookup",
      30,
      900,
      "Too many order lookups. Try again in 15 minutes."
    ),
    async (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    if (!orderId) {
      throw new ValidationError("Order ID is required");
    }
    const registration = await repository.getRegistrationByOrderId(orderId);
    if (!registration) {
      res.status(404).json({ detail: "Registration not found" });
      return;
    }
    res.json(toRegistrationRead(registration));
  });

  return router;
}

module.exports = {
  createCyclothonRouter,
};
