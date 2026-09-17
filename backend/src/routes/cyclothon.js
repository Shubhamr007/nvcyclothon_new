const crypto = require("crypto");
const express = require("express");
const {
  parseSchema,
  registrationCreateSchema,
  paymentVerifySchema,
  normalizeRegistrationInput,
} = require("../services/validation");
const { ValidationError } = require("../errors");

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
  razorpayService,
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

  router.post("/webhook/razorpay", async (req, res) => {
    if (!config.razorpayEnabled || !config.razorpayWebhookSecret) {
      res.status(404).json({ detail: "Not found" });
      return;
    }
    const signature = String(req.header("x-razorpay-signature") || "");
    const expected = crypto
      .createHmac("sha256", config.razorpayWebhookSecret)
      .update(req.rawBody || Buffer.from(JSON.stringify(req.body || {})))
      .digest("hex");
    if (
      !signature ||
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      res.status(401).json({ detail: "Invalid webhook signature" });
      return;
    }
    const payment = req.body?.payload?.payment?.entity;
    if (req.body?.event === "payment.captured" && payment?.order_id && payment?.id) {
      await repository.markCyclothonPaymentFromWebhook({
        orderId: payment.order_id,
        paymentId: payment.id,
      });
    }
    res.status(204).end();
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
        razorpayEnabled: config.razorpayEnabled,
        razorpayKeyId: config.razorpayKeyId,
        eventDate: settings.event_date,
        createPaymentOrder: ({ amountPaise, receipt }) =>
          razorpayService.createOrder({ amountPaise, receipt }),
      });

      if (!config.razorpayEnabled) {
        void sendAndRecordRegistrationConfirmation(result.registration);
      }

      res.status(201).json({
        ...toRegistrationRead(result.registration),
        checkout: result.checkout,
      });
    }
  );

  router.post("/registrations/:registrationId/payment/verify", async (req, res) => {
    const registrationId = Number.parseInt(req.params.registrationId, 10);
    if (!Number.isInteger(registrationId) || registrationId <= 0) {
      throw new ValidationError("Invalid registration id");
    }

    const payload = parseSchema(paymentVerifySchema, req.body);
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpayKeySecret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest("hex");

    const registration = await repository.verifyCyclothonPayment(
      registrationId,
      payload,
      expectedSignature
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

  return router;
}

module.exports = {
  createCyclothonRouter,
};
