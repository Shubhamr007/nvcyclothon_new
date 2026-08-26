const express = require("express");
const { ValidationError, UnauthorizedError } = require("../errors");
const {
  parseSchema,
  volunteerSessionSchema,
  checkinScanSchema,
  checkinManualSchema,
} = require("../services/validation");
const {
  safeCompare,
  issueVolunteerToken,
  requireVolunteer,
} = require("../services/security");

const CHECKIN_TOKEN_PATTERN = /^[A-Za-z0-9_-]{12,128}$/;

function parseCheckinToken(scanValue, qrPrefix) {
  const raw = String(scanValue || "").trim();
  if (!raw) {
    throw new ValidationError("Scan value is required");
  }

  const prefix = String(qrPrefix || "nvcyclothon-checkin:");
  if (raw.startsWith(prefix)) {
    const token = raw.slice(prefix.length).trim();
    if (!token) {
      throw new ValidationError("Invalid QR payload");
    }
    return token;
  }

  try {
    const parsed = new URL(raw);
    const byQuery =
      parsed.searchParams.get("token") || parsed.searchParams.get("checkin_token");
    if (byQuery) {
      return byQuery.trim();
    }
  } catch {
    // Accept plain token formats for scanner fallback mode.
  }

  return raw;
}

function toParticipantSummary(record) {
  return {
    id: record.id,
    full_name: record.full_name,
    email: record.email,
    phone: record.phone,
    city: record.city,
    ride_category: record.ride_category,
    status: record.status,
    payment_status: record.payment_status,
    checked_in_at: record.checked_in_at,
    checked_in_by: record.checked_in_by,
    checkin_method: record.checkin_method,
    payment_verified_at: record.payment_verified_at,
    created_at: record.created_at,
  };
}

function createCheckinRouter({ config, repository, rateLimiter }) {
  const router = express.Router();

  router.get("/status", (_req, res) => {
    res.json({ enabled: Boolean(config.volunteerCheckinEnabled) });
  });

  router.post("/session", (req, res) => {
    if (!config.volunteerCheckinEnabled) {
      throw new UnauthorizedError("Volunteer check-in is disabled");
    }

    const key = req.ip || req.connection?.remoteAddress || "unknown";
    rateLimiter.check({
      scope: "volunteer-checkin",
      key,
      maximum: 20,
      seconds: 900,
      message: "Too many volunteer login attempts. Try again in 15 minutes.",
    });

    const payload = parseSchema(volunteerSessionSchema, req.body);
    const configuredCredentials = config.volunteerCheckinCredentials || {};
    const configuredNames = Object.keys(configuredCredentials);

    if (configuredNames.length > 0) {
      const expectedPin = configuredCredentials[payload.volunteer_name];
      if (!expectedPin || !safeCompare(payload.volunteer_pin, expectedPin)) {
        throw new UnauthorizedError("Invalid volunteer credentials");
      }
    } else {
      if (!config.volunteerCheckinPin) {
        throw new UnauthorizedError("Volunteer check-in pin is not configured");
      }
      if (!safeCompare(payload.volunteer_pin, config.volunteerCheckinPin)) {
        throw new UnauthorizedError("Invalid volunteer credentials");
      }
    }

    const volunteerName = payload.volunteer_name;
    res.json({
      access_token: issueVolunteerToken(config, volunteerName),
      token_type: "bearer",
      expires_in: config.volunteerSessionTtlSeconds,
      volunteer_name: volunteerName,
    });
  });

  router.use(requireVolunteer(config));

  router.get("/participants/search", async (req, res) => {
    const query = String(req.query.q || "").trim();
    const numericOnly = /^\d+$/.test(query);
    if (query.length < 2 && !numericOnly) {
      throw new ValidationError("Enter at least 2 characters to search");
    }

    const participants = await repository.searchRegistrationsForCheckin(query, 25);
    res.json({
      count: participants.length,
      items: participants.map(toParticipantSummary),
    });
  });

  router.post("/participants/scan", async (req, res) => {
    const payload = parseSchema(checkinScanSchema, req.body);
    const token = parseCheckinToken(payload.scan_value, config.checkinQrPrefix);

    if (!CHECKIN_TOKEN_PATTERN.test(token)) {
      throw new ValidationError("Invalid QR token");
    }

    const result = await repository.checkInByToken(token, {
      volunteerName: req.volunteerSession?.volunteer_name || "Volunteer",
      method: "qr",
      sourceDevice: payload.source_device || null,
    });

    res.json({
      already_checked_in: result.already_checked_in,
      participant: toParticipantSummary(result.registration),
    });
  });

  router.post("/participants/manual-checkin", async (req, res) => {
    const payload = parseSchema(checkinManualSchema, req.body);

    const result = await repository.checkInByRegistrationId(payload.registration_id, {
      volunteerName: req.volunteerSession?.volunteer_name || "Volunteer",
      method: "manual",
      sourceDevice: payload.source_device || null,
    });

    res.json({
      already_checked_in: result.already_checked_in,
      participant: toParticipantSummary(result.registration),
    });
  });

  return router;
}

module.exports = {
  createCheckinRouter,
};
