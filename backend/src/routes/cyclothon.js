const express = require("express");
const crypto = require("crypto");
const {
  parseSchema,
  registrationCreateSchema,
  registrationFollowupSchema,
  cashfreePaymentVerifySchema,
  normalizeRegistrationInput,
  normalizeIndianMobile,
  normalizeEmail,
  validateCategoryAge,
} = require("../services/validation");
const { ValidationError, NotFoundError } = require("../errors");

const {
  toRegistrationRead,
  sendAndRecordRegistrationConfirmation: sendConfirmation,
} = require("./cyclothonHelpers");
const { adminEvents } = require("../services/adminEvents");

function createCyclothonRouter({
  config,
  repository,
  emailService,
  cashfreeService,
  rateLimiter,
}) {
  const router = express.Router();

  const sendAndRecordRegistrationConfirmation = (registration) =>
    sendConfirmation({ repository, emailService, config, registration });

  const getFollowupHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

  router.get("/registrations/follow-up/:token", async (req, res) => {
    const token = String(req.params.token || "");
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) throw new NotFoundError("This form link is invalid or expired");
    const participant = await repository.getRegistrationFollowupByTokenHash(getFollowupHash(token));
    if (!participant) throw new NotFoundError("This form link is invalid, expired, or already submitted");
    res.set("Cache-Control", "no-store");
    res.json({ participant });
  });

  router.post(
    "/registrations/follow-up/:token",
    rateLimiter.middleware("registration-followup", 10, 900, "Too many form submissions. Please try again later."),
    async (req, res) => {
    const token = String(req.params.token || "");
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) throw new NotFoundError("This form link is invalid or expired");
    const tokenHash = getFollowupHash(token);
    const participant = await repository.getRegistrationFollowupByTokenHash(tokenHash);
    if (!participant) throw new NotFoundError("This form link is invalid, expired, or already submitted");
    const payload = parseSchema(registrationFollowupSchema, req.body);
    let emergencyContact;
    try {
      emergencyContact = normalizeIndianMobile(payload.emergency_contact);
    } catch {
      throw new ValidationError("Enter a valid emergency contact mobile number");
    }
    const update = {
      ...payload,
      emergency_contact: emergencyContact,
      address_line2: payload.address_line2 || null,
      ...(Number(participant.age) < 18 ? {} : {
        guardian_name: null,
        guardian_relationship: null,
        guardian_email: null,
        guardian_phone: null,
      }),
    };
    if (Number(participant.age) < 18) {
      if (!payload.guardian_name || !payload.guardian_relationship || !payload.guardian_email || !payload.guardian_phone) {
        throw new ValidationError("Enter the guardian’s name, relationship, email, and phone for this under-18 participant");
      }
      update.guardian_email = normalizeEmail(payload.guardian_email);
      try {
        update.guardian_phone = normalizeIndianMobile(payload.guardian_phone);
      } catch {
        throw new ValidationError("Enter a valid guardian mobile number");
      }
    }
    const saved = await repository.submitRegistrationFollowup(tokenHash, update);
    if (!saved) throw new NotFoundError("This form link is invalid, expired, or already submitted");
    res.set("Cache-Control", "no-store");
    res.json({ status: "completed", registration_id: saved.id });
    }
  );

  const handlePaymentSuccess = (reg, orderId, paymentId) => {
    void sendAndRecordRegistrationConfirmation(reg);
    void emailService.sendPaymentReceipt({
      recipient: reg.email,
      name: reg.full_name,
      orderId: reg.id,
      totalPaise: reg.registration_fee_paise,
    });
    adminEvents.publish({ type: "registrations", action: "payment_verified", id: reg.id, data: { orderId, paymentId } });
    adminEvents.publish({ type: "analytics", action: "updated" });
  };

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
    // Note: Cashfree dashboard test ping sends type: "WEBHOOK" with a test signature
    const eventType = String(req.body?.type || req.body?.event || "").toUpperCase();
    const isTestPing =
      !signature ||
      eventType === "WEBHOOK" ||
      eventType === "TEST" ||
      eventType === "TEST_WEBHOOK" ||
      eventType === "TEST_NOTIFICATION" ||
      req.body?.test === true ||
      req.header("x-webhook-test") === "true";

    if (isTestPing) {
      console.log("[Cashfree Webhook] Acknowledged test ping successfully. Event type:", eventType);
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
          bankReference: payment.bank_reference ? String(payment.bank_reference) : null,
          paymentTime: payment.payment_time || null,
          paymentMethod: payment.payment_group || null,
        });
        if (updated) {
          adminEvents.publish({
            type: "registrations",
            action: "payment_received",
            id: updated.id,
            data: { orderId: order.order_id, paymentId: String(payment.cf_payment_id) },
          });
          adminEvents.publish({ type: "analytics", action: "updated" });
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
      validateCategoryAge(payload, settings.race_categories);
      if (!payload.waiver_accepted || !payload.privacy_accepted) {
        throw new ValidationError(
          "The rider waiver and privacy notice must be accepted"
        );
      }

      const result = await repository.createCyclothonRegistration(payload, {
        paymentEnabled: config.cashfreeEnabled,
        eventDate: settings.event_date,
        earlyBirdLimit: settings.early_bird_limit,
        earlyBirdEnabled: settings.early_bird_enabled !== false,
        raceCategories: settings.race_categories,
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
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          }),
      });

      if (!config.cashfreeEnabled) {
        void sendAndRecordRegistrationConfirmation(result.registration);
      }

      adminEvents.publish({ type: "registrations", action: "created", id: result.registration.id });
      adminEvents.publish({ type: "analytics", action: "updated" });

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
        bank_reference: payment.bankReference,
        payment_time: payment.paymentTime,
        payment_method: payment.paymentMethod,
        signature: "cashfree-server-verified",
      },
      "cashfree-server-verified"
    );

    handlePaymentSuccess(registration, payload.order_id, payment.paymentId);
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
          bank_reference: payment.bankReference,
          payment_time: payment.paymentTime,
          payment_method: payment.paymentMethod,
          signature: "cashfree-server-verified",
        },
        "cashfree-server-verified"
      );

      handlePaymentSuccess(updated, payload.order_id, payment.paymentId);
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
