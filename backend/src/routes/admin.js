const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const multer = require("multer");
const { parse: parseCsv } = require("csv-parse/sync");
const ExcelJS = require("exceljs");
const pdfParse = require("pdf-parse");
const { generateParticipationCertificate, generateRiderPassPdf, riderId } = require("../services/eventDocuments");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnsupportedMediaTypeError,
  TooLargeError,
} = require("../errors");
const {
  parseSchema,
  bulkStatusUpdateSchema,
  statusUpdateSchema,
  offerSchema,
  chiefGuestSchema,
  organizingMemberSchema,
  sponsorshipTierSchema,
  delegationSchema,
  eventUpdateEmailSchema,
  siteSettingsPatchSchema,
  communityModerationSchema,
  volunteerAccountCreateSchema,
  volunteerAccountUpdateSchema,
  normalizeOfferInput,
  normalizeChiefGuestInput,
  normalizeOrganizingMemberInput,
  normalizeDelegationInput,
  partnerVendorReviewSchema,
} = require("../services/validation");
const { deleteCommunityImage } = require("../services/communityMedia");
const { getOrCreatePdf } = require("../services/documentStorage");
const { storeProfileImage } = require("../services/profileMedia");
const { createPartnerVendorMediaService } = require("../services/partnerVendorMedia");

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function parsePositiveInt(value, fieldName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
  return parsed;
}

const DOCUMENT_VERSION = "2026-approved-v2";

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function consume() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => consume())
  );
  return results;
}

async function getCachedRiderPass(config, repository, registration, checkinPayload, settings = null) {
  const siteSettings = settings || (await repository.getSiteSettings());
  return getOrCreatePdf({
    rootDirectory: config.uploadDir,
    directory: "generated-documents",
    filename: `rider-pass-${DOCUMENT_VERSION}-${registration.id}.pdf`,
    generate: () => generateRiderPassPdf({
      templatePath: config.riderPassTemplatePath,
      registration,
      checkinPayload,
      eventDate: siteSettings.event_date,
      assemblyPoint: siteSettings.event_location,
    }),
  });
}

async function getCachedCertificate(config, repository, registration, settings = null) {
  const siteSettings = settings || (await repository.getSiteSettings());
  return getOrCreatePdf({
    rootDirectory: config.uploadDir,
    directory: "generated-documents",
    filename: `certificate-${DOCUMENT_VERSION}-${registration.id}.pdf`,
    generate: () => generateParticipationCertificate({
      templatePath: config.certificateTemplatePath,
      registration,
      eventDate: siteSettings.event_date,
      venue: siteSettings.event_location,
    }),
  });
}

function toVolunteerAccountRead(account) {
  return {
    id: account.id,
    volunteer_id: account.volunteer_id,
    display_name: account.display_name,
    active: account.active,
    created_at: account.created_at,
    updated_at: account.updated_at,
  };
}

function runMulter(upload, req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, (error) => {
      if (!error) {
        resolve();
        return;
      }
      if (error.code === "LIMIT_FILE_SIZE") {
        reject(new TooLargeError("The uploaded file exceeds the upload limit"));
        return;
      }
      reject(error);
    });
  });
}

function normalizeRosterRow(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    const normalizedKey = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    normalized[normalizedKey] = value;
  }
  return normalized;
}

function normalizeWorksheetCell(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "result")) {
      return value.result ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(value, "text")) {
      return value.text ?? null;
    }
    if (Array.isArray(value.richText)) {
      return value.richText.map((item) => item.text || "").join("") || null;
    }
    if (value.hyperlink) {
      return value.text || value.hyperlink;
    }
  }
  return value;
}

function parseCsvRows(content) {
  const records = parseCsv(content, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  return records.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row || {})) {
      normalized[key] = value === "" ? null : value;
    }
    return normalized;
  });
}

async function parseXlsxRows(content) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(content);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers = [];
  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const value = normalizeWorksheetCell(headerRow.getCell(column).value);
    headers.push(String(value || "").trim());
  }
  if (!headers.some(Boolean)) {
    return [];
  }

  const rows = [];
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const mapped = {};
    let hasValue = false;
    for (let column = 1; column <= headers.length; column += 1) {
      const key = headers[column - 1];
      if (!key) {
        continue;
      }
      const value = normalizeWorksheetCell(row.getCell(column).value);
      mapped[key] = value === "" ? null : value;
      if (value !== null && value !== undefined && value !== "") {
        hasValue = true;
      }
    }
    if (hasValue) {
      rows.push(mapped);
    }
  }
  return rows;
}

async function parseRosterRows(file) {
  const filename = String(file.originalname || "").toLowerCase();
  const content = file.buffer;

  if (filename.endsWith(".csv") || filename.endsWith(".xlsx")) {
    try {
      if (filename.endsWith(".csv")) {
        return parseCsvRows(content);
      }
      return await parseXlsxRows(content);
    } catch {
      if (filename.endsWith(".csv")) {
        throw new UnsupportedMediaTypeError("CSV roster must use UTF-8 encoding");
      }
      throw new UnsupportedMediaTypeError("Unable to read this roster spreadsheet");
    }
  }

  if (filename.endsWith(".pdf")) {
    if (!content.slice(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new UnsupportedMediaTypeError("Invalid PDF roster");
    }
    return [{ __pdf__: true, __content__: content }];
  }

  throw new UnsupportedMediaTypeError(
    "Upload a CSV, XLSX, or text-based PDF participant roster"
  );
}

function createCrudHandlers({
  list,
  create,
  update,
  remove,
  parseCreate,
  parseUpdate,
}) {
  return {
    list: async (_req, res) => {
      const items = await list();
      res.json(items);
    },
    create: async (req, res) => {
      const payload = parseCreate(req.body);
      const item = await create(payload);
      res.status(201).json(item);
    },
    update: async (req, res) => {
      const itemId = parsePositiveInt(req.params.itemId, "record id");
      const payload = parseUpdate(req.body);
      const item = await update(itemId, payload);
      if (!item) {
        throw new NotFoundError("Record not found");
      }
      res.json(item);
    },
    remove: async (req, res) => {
      const itemId = parsePositiveInt(req.params.itemId, "record id");
      const deleted = await remove(itemId);
      if (!deleted) {
        throw new NotFoundError("Record not found");
      }
      res.status(204).send();
    },
  };
}

function createAdminRouter({ config, repository, emailService }) {
  const router = express.Router();

  async function recordDelivery(registration, emailType, subject, sent) {
    await repository.recordEmailDelivery({
      registrationId: registration.id,
      emailType,
      recipient: registration.email,
      subject,
      sent,
      status: config.emailEnabled ? (sent ? "sent" : "failed") : "disabled",
    });
  }

  const rosterUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxUploadSizeBytes,
      files: 1,
    },
  }).single("roster_file");

  const certificateUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxUploadSizeBytes,
      files: 1,
    },
  }).single("certificate_file");

  router.get("/analytics", async (_req, res) => {
    const analytics = await repository.getAnalytics();
    const pvAnalytics = await repository.getPartnerVendorAnalytics();
    res.json({ ...analytics, ...pvAnalytics });
  });
  router.get("/visitor-analytics", async (_req, res) => {
    res.json(await repository.getVisitorAnalytics());
  });

  router.post("/profile-images", async (req, res) => {
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single("image");
    await runMulter(upload, req, res);
    res.status(201).json({ image_url: await storeProfileImage(config, req.file) });
  });

  router.get("/settings", async (_req, res) => {
    const settings = await repository.getSiteSettings();
    res.json(settings);
  });

  router.patch("/settings", async (req, res) => {
    const patch = parseSchema(siteSettingsPatchSchema, req.body || {});
    const settings = await repository.updateSiteSettings(patch);
    res.json(settings);
  });

  router.get("/volunteers", async (_req, res) => {
    const accounts = await repository.listVolunteerAccounts();
    res.json(accounts.map(toVolunteerAccountRead));
  });

  router.post("/volunteers", async (req, res) => {
    const payload = parseSchema(volunteerAccountCreateSchema, req.body || {});
    const account = await repository.createVolunteerAccount({
      volunteer_id: payload.volunteer_id,
      display_name: payload.display_name,
      password_hash: await bcrypt.hash(payload.password, 12),
    });
    res.status(201).json(toVolunteerAccountRead(account));
  });

  router.patch("/volunteers/:volunteerId", async (req, res) => {
    const id = parsePositiveInt(req.params.volunteerId, "volunteer id");
    const payload = parseSchema(volunteerAccountUpdateSchema, req.body || {});
    const account = await repository.updateVolunteerAccount(id, {
      display_name: payload.display_name,
      active: payload.active,
      password_hash: payload.password ? await bcrypt.hash(payload.password, 12) : undefined,
    });
    if (!account) throw new NotFoundError("Volunteer account not found");
    res.json(toVolunteerAccountRead(account));
  });

  router.get("/community/posts", async (req, res) => {
    const status = String(req.query.status || "pending").toLowerCase();
    if (!["pending", "approved"].includes(status)) {
      throw new ValidationError("Invalid status filter");
    }
    const items =
      status === "pending"
        ? await repository.listPendingCommunityPosts(100)
        : await repository.listApprovedCommunityPosts(200);
    res.json({
      status,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        message: item.message,
        image_url: item.image_key
          ? `/api/admin/community/media/${item.image_key}`
          : null,
        status: item.status,
        created_at: item.created_at,
        moderated_at: item.moderated_at,
        moderated_by: item.moderated_by,
        moderation_reason: item.moderation_reason,
        submitted_ip: item.submitted_ip,
      })),
    });
  });

  router.get("/community/media/:key", async (req, res, next) => {
    try {
      const post = await repository.getCommunityPostByImageKey(req.params.key);
      if (!post) {
        throw new NotFoundError("Media not found");
      }
      const { resolveCommunityImagePath } = require("../services/communityMedia");
      const target = resolveCommunityImagePath(config, req.params.key);
      if (!target) {
        throw new NotFoundError("Media not found");
      }
      res.set("Cache-Control", "private, no-store");
      res.type(post.image_content_type || "image/webp").sendFile(target);
    } catch (error) {
      next(error);
    }
  });

  router.post("/community/posts/:id/moderate", async (req, res) => {
    const postId = parsePositiveInt(req.params.id, "post id");
    const payload = parseSchema(communityModerationSchema, req.body || {});
    const record = await repository.moderateCommunityPost(postId, {
      status: payload.status,
      moderator: req.adminSession?.subject || "admin",
      reason: payload.reason || null,
    });
    if (payload.status === "rejected" && record.image_key) {
      deleteCommunityImage(config, record.image_key);
    }
    res.json({
      id: record.id,
      status: record.status,
      moderated_at: record.moderated_at,
      moderated_by: record.moderated_by,
      moderation_reason: record.moderation_reason,
    });
  });

  router.get("/registrations", async (_req, res) => {
    const registrations = await repository.listRegistrations();
    res.json(registrations);
  });

  router.post("/registrations/bulk-status", async (req, res) => {
    const payload = parseSchema(bulkStatusUpdateSchema, req.body);
    if (payload.status === "checked_in") {
      throw new ValidationError("Use the volunteer check-in workspace for checked-in status");
    }
    const result = await repository.bulkUpdateRegistrationStatus(
      payload.registration_ids,
      payload.status
    );
    res.json(result);
  });

  router.post("/registrations/roster-match", async (req, res) => {
    await runMulter(rosterUpload, req, res);
    if (!req.file) {
      throw new ValidationError("Upload a roster file");
    }

    const rows = await parseRosterRows(req.file);
    const contacts = await repository.listRegistrationContacts();
    const byEmail = new Map(
      contacts.map((item) => [String(item.email || "").trim().toLowerCase(), item.id])
    );
    const byId = new Map(contacts.map((item) => [String(item.id), item.id]));

    const matchedIds = new Set();
    let unmatched = 0;

    if (rows.length === 1 && rows[0].__pdf__) {
      let text;
      try {
        const parsed = await pdfParse(rows[0].__content__);
        text = parsed.text || "";
      } catch {
        throw new UnsupportedMediaTypeError("Unable to read this PDF roster");
      }
      const emails = text.match(EMAIL_REGEX) || [];
      for (const email of emails) {
        const normalized = email.trim().toLowerCase();
        const matchedId = byEmail.get(normalized);
        if (matchedId) {
          matchedIds.add(matchedId);
        } else {
          unmatched += 1;
        }
      }
    } else {
      for (const row of rows) {
        const normalized = normalizeRosterRow(row);
        const email = String(
          normalized.email || normalized.email_address || ""
        )
          .trim()
          .toLowerCase();
        const riderId = String(
          normalized.rider_id || normalized.registration_id || normalized.id || ""
        ).trim();

        const matchedId = byEmail.get(email) || byId.get(riderId);
        if (matchedId) {
          matchedIds.add(matchedId);
        } else if (email || riderId) {
          unmatched += 1;
        }
      }
    }

    res.json({
      matched_ids: Array.from(matchedIds).sort((a, b) => a - b),
      matched: matchedIds.size,
      unmatched,
    });
  });

  router.post("/registrations/certificates", async (req, res) => {
    await runMulter(certificateUpload, req, res);

    if (!req.file) {
      throw new ValidationError("Upload a PDF certificate file");
    }

    let registrationIds;
    try {
      registrationIds = JSON.parse(req.body.registration_ids || "[]");
    } catch {
      throw new ValidationError("registration_ids must be a JSON array");
    }

    const ids = [...new Set(registrationIds)]
      .map((item) => Number.parseInt(String(item), 10))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((a, b) => a - b);

    if (!ids.length) {
      throw new ValidationError("Select at least one participant");
    }

    const filename = String(req.file.originalname || "").toLowerCase();
    if (!filename.endsWith(".pdf")) {
      throw new UnsupportedMediaTypeError("Upload a PDF certificate file");
    }
    if (!req.file.buffer.slice(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new UnsupportedMediaTypeError("Invalid PDF certificate file");
    }

    const registrations = await repository.getRegistrationsByIds(ids);
    const eligible = registrations.filter((item) => item.status === "checked_in");

    await Promise.all(
      eligible.map(async (registration) => {
        const sent = await emailService.sendParticipationCertificate({
          recipient: registration.email,
          name: registration.full_name,
          riderId: riderId(registration),
          route: registration.ride_category,
          certificatePdf: req.file.buffer,
        });
        await repository.recordParticipationCertificate(registration.id, sent);
        await recordDelivery(registration, "certificate", "Congratulations on completing NV Cyclothon 2026", sent);
      })
    );

    const queuedIds = eligible.map((item) => item.id);
    res.status(202).json({
      queued: eligible.length,
      queued_ids: queuedIds,
      skipped: registrations.length - eligible.length,
      skipped_ids: registrations
        .filter((item) => !queuedIds.includes(item.id))
        .map((item) => item.id),
      missing_ids: ids.filter((id) => !registrations.some((item) => item.id === id)),
    });
  });

  router.post("/registrations/certificates/generate", async (req, res) => {
    if (!Array.isArray(req.body)) {
      throw new ValidationError("registration_ids must be an array");
    }

    const ids = [...new Set(req.body)]
      .map((item) => Number.parseInt(String(item), 10))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((a, b) => a - b);
    if (!ids.length) {
      throw new ValidationError("Select at least one participant");
    }

    const [settings, registrations] = await Promise.all([
      repository.getSiteSettings(),
      repository.getRegistrationsByIds(ids),
    ]);
    const eligible = registrations.filter((item) => item.status === "checked_in");
    const sentIds = [];
    const failedIds = [];

    await mapWithConcurrency(eligible, 5, async (registration) => {
      const certificatePdf = await getCachedCertificate(config, repository, registration, settings);
      const sent = await emailService.sendParticipationCertificate({
        recipient: registration.email,
        name: registration.full_name,
        riderId: riderId(registration),
        route: registration.ride_category,
        certificatePdf,
      });
      await repository.recordParticipationCertificate(registration.id, sent);
      await recordDelivery(registration, "certificate", "Congratulations on completing NV Cyclothon 2026", sent);
      (sent ? sentIds : failedIds).push(registration.id);
    });

    const queuedIds = eligible.map((item) => item.id);
    res.status(202).json({
      queued: eligible.length,
      queued_ids: queuedIds,
      skipped: registrations.length - eligible.length,
      skipped_ids: registrations
        .filter((item) => !queuedIds.includes(item.id))
        .map((item) => item.id),
      missing_ids: ids.filter((id) => !registrations.some((item) => item.id === id)),
      sent_ids: sentIds,
      failed_ids: failedIds,
    });
  });

  router.get("/registrations/:registrationId/certificate-preview", async (req, res) => {
    const registrationId = parsePositiveInt(req.params.registrationId, "registration id");
    const registration = await repository.getRegistrationById(registrationId);
    if (!registration) {
      throw new NotFoundError("Record not found");
    }
    if (registration.status !== "checked_in") {
      throw new ConflictError(
        "Only checked-in participants are eligible for certificates"
      );
    }

    const certificatePdf = await getCachedCertificate(config, repository, registration);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"nv-cyclothon-certificate-${registration.id}.pdf\"`
    );
    res.send(certificatePdf);
  });

  router.post("/registrations/rider-passes/generate", async (req, res) => {
    if (!Array.isArray(req.body)) {
      throw new ValidationError("registration_ids must be an array");
    }
    const ids = [...new Set(req.body)]
      .map((item) => Number.parseInt(String(item), 10))
      .filter((item) => Number.isInteger(item) && item > 0)
      .sort((a, b) => a - b);
    if (!ids.length) throw new ValidationError("Select at least one participant");

    const [settings, registrations] = await Promise.all([
      repository.getSiteSettings(),
      repository.getRegistrationsByIds(ids),
    ]);
    const eligible = registrations.filter((item) => item.payment_status === "paid" && item.status !== "cancelled");
    const sentIds = [];
    const failedIds = [];
    await mapWithConcurrency(eligible, 5, async (registration) => {
      const checkinPayload = registration.checkin_token
        ? `${config.checkinQrPrefix}${registration.checkin_token}`
        : "";
      const riderPassPdf = await getCachedRiderPass(config, repository, registration, checkinPayload, settings);
      const sent = await emailService.sendRiderPass({ recipient: registration.email, registration, riderPassPdf });
      await repository.recordRiderPass(registration.id, sent);
      await recordDelivery(registration, "rider_pass", "Your official NV Cyclothon 2026 rider pass", sent);
      (sent ? sentIds : failedIds).push(registration.id);
    });
    const queuedIds = eligible.map((item) => item.id);
    res.status(202).json({ queued: eligible.length, queued_ids: queuedIds, skipped: registrations.length - eligible.length, skipped_ids: registrations.filter((item) => !queuedIds.includes(item.id)).map((item) => item.id), missing_ids: ids.filter((id) => !registrations.some((item) => item.id === id)), sent_ids: sentIds, failed_ids: failedIds });
  });

  router.get("/registrations/:registrationId/rider-pass-preview", async (req, res) => {
    const registrationId = parsePositiveInt(req.params.registrationId, "registration id");
    const registration = await repository.getRegistrationById(registrationId);
    if (!registration) throw new NotFoundError("Record not found");
    if (registration.payment_status !== "paid" || registration.status === "cancelled") {
      throw new ConflictError("Only paid, active participants are eligible for rider passes");
    }
    const riderPassPdf = await getCachedRiderPass(
      config,
      repository,
      registration,
      registration.checkin_token ? `${config.checkinQrPrefix}${registration.checkin_token}` : ""
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"nv-cyclothon-rider-pass-${registration.id}.pdf\"`);
    res.send(riderPassPdf);
  });

  router.patch("/registrations/:registrationId", async (req, res) => {
    const registrationId = parsePositiveInt(req.params.registrationId, "registration id");
    const payload = parseSchema(statusUpdateSchema, req.body);
    if (payload.status === "checked_in") {
      throw new ValidationError("Use the volunteer check-in workspace for checked-in status");
    }
    const registration = await repository.updateRegistrationStatus(
      registrationId,
      payload.status
    );
    if (!registration) {
      throw new NotFoundError("Record not found");
    }
    res.json(registration);
  });

  router.post("/event-updates/email", async (req, res) => {
    const payload = parseSchema(eventUpdateEmailSchema, req.body);
    const recipients = await repository.listRegistrationEmails();
    await emailService.sendEventUpdate({
      recipients,
      subject: payload.subject,
      message: payload.message,
    });
    res.status(202).json({ queued_recipients: recipients.length });
  });

  const offerCrud = createCrudHandlers({
    list: () => repository.listOffers(),
    create: (payload) => repository.createOffer(payload),
    update: (id, payload) => repository.updateOffer(id, payload),
    remove: (id) => repository.deleteOffer(id),
    parseCreate: (body) => normalizeOfferInput(parseSchema(offerSchema, body)),
    parseUpdate: (body) => normalizeOfferInput(parseSchema(offerSchema, body)),
  });

  router.get("/offers", offerCrud.list);
  router.post("/offers", offerCrud.create);
  router.put("/offers/:itemId", offerCrud.update);
  router.delete("/offers/:itemId", offerCrud.remove);

  const chiefGuestCrud = createCrudHandlers({
    list: () => repository.listChiefGuests(),
    create: (payload) => repository.createChiefGuest(payload),
    update: (id, payload) => repository.updateChiefGuest(id, payload),
    remove: (id) => repository.deleteChiefGuest(id),
    parseCreate: (body) => normalizeChiefGuestInput(parseSchema(chiefGuestSchema, body)),
    parseUpdate: (body) => normalizeChiefGuestInput(parseSchema(chiefGuestSchema, body)),
  });

  router.get("/chief-guests", chiefGuestCrud.list);
  router.post("/chief-guests", chiefGuestCrud.create);
  router.put("/chief-guests/:itemId", chiefGuestCrud.update);
  router.delete("/chief-guests/:itemId", chiefGuestCrud.remove);

  const organizingMemberCrud = createCrudHandlers({
    list: () => repository.listOrganizingMembers(),
    create: (payload) => repository.createOrganizingMember(payload),
    update: (id, payload) => repository.updateOrganizingMember(id, payload),
    remove: (id) => repository.deleteOrganizingMember(id),
    parseCreate: (body) => normalizeOrganizingMemberInput(parseSchema(organizingMemberSchema, body)),
    parseUpdate: (body) => normalizeOrganizingMemberInput(parseSchema(organizingMemberSchema, body)),
  });

  router.get("/organizing-members", organizingMemberCrud.list);
  router.post("/organizing-members", organizingMemberCrud.create);
  router.put("/organizing-members/:itemId", organizingMemberCrud.update);
  router.delete("/organizing-members/:itemId", organizingMemberCrud.remove);

  const sponsorshipTierCrud = createCrudHandlers({
    list: () => repository.listSponsorshipTiers(),
    create: (payload) => repository.createSponsorshipTier(payload),
    update: (id, payload) => repository.updateSponsorshipTier(id, payload),
    remove: (id) => repository.deleteSponsorshipTier(id),
    parseCreate: (body) => parseSchema(sponsorshipTierSchema, body),
    parseUpdate: (body) => parseSchema(sponsorshipTierSchema, body),
  });
  router.get("/sponsorship-tiers", sponsorshipTierCrud.list);
  router.post("/sponsorship-tiers", sponsorshipTierCrud.create);
  router.put("/sponsorship-tiers/:itemId", sponsorshipTierCrud.update);
  router.delete("/sponsorship-tiers/:itemId", sponsorshipTierCrud.remove);

  const delegationCrud = createCrudHandlers({
    list: () => repository.listDelegations(),
    create: (payload) => repository.createDelegation(payload),
    update: (id, payload) => repository.updateDelegation(id, payload),
    remove: (id) => repository.deleteDelegation(id),
    parseCreate: (body) => normalizeDelegationInput(parseSchema(delegationSchema, body)),
    parseUpdate: (body) => normalizeDelegationInput(parseSchema(delegationSchema, body)),
  });

  router.get("/delegations", delegationCrud.list);
  router.post("/delegations", delegationCrud.create);
  router.put("/delegations/:itemId", delegationCrud.update);
  router.delete("/delegations/:itemId", delegationCrud.remove);

  // --- Partner Applications ---
  router.get('/partner-applications', async (req, res) => {
    const status = req.query.status || null;
    const search = req.query.search || null;
    const items = await repository.listPartnerApplications({ status, search });
    res.json(items);
  });

  router.get('/partner-applications/export', async (req, res) => {
    const items = await repository.listPartnerApplications();
    const headers = [
      'Ref Number', 'Company Name', 'Contact Name', 'Email', 'Phone',
      'Package', 'Partnership Type', 'Status', 'Payment Status', 'Created At'
    ];
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const rows = items.map(item => [
      escapeCsv(item.application_number || `NV-26-P-${item.id}`),
      escapeCsv(item.company_name),
      escapeCsv(item.contact_name),
      escapeCsv(item.email),
      escapeCsv(item.phone),
      escapeCsv(item.package_name || item.tier_name || 'Custom'),
      escapeCsv(item.partnership_type),
      escapeCsv(item.status),
      escapeCsv(item.payment_status),
      escapeCsv(item.created_at),
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="nv_cyclothon_partners.csv"');
    res.send(csvContent);
  });

  router.get('/partner-applications/:id', async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const item = await repository.getPartnerApplicationById(id);
    if (!item) throw new NotFoundError('Partner application not found');
    res.json(item);
  });

  router.post(['/partner-applications/:id/review', '/partner-applications/:id/status'], async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const payload = parseSchema(partnerVendorReviewSchema, req.body);
    const existing = await repository.getPartnerApplicationById(id);
    if (!existing) throw new NotFoundError('Partner application not found');
    const updated = await repository.updatePartnerApplicationStatus(id, {
      status: payload.status,
      reviewer: 'admin',
      notes: payload.notes,
    });
    // Send email notification on approval or rejection
    try {
      const normalizedStatus = String(payload.status).toLowerCase();
      if (normalizedStatus === 'approved') {
        await emailService.sendPartnerApprovalNotification(updated);
      } else if (normalizedStatus === 'rejected') {
        await emailService.sendPartnerRejectionNotification(updated);
      }
    } catch (emailErr) {
      console.error('Partner review email failed:', emailErr);
    }
    res.json(updated);
  });

  router.get('/partner-applications/:id/deliverables', async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const deliverables = await repository.listPartnerDeliverables(id);
    res.json(deliverables);
  });

  router.patch('/partner-applications/:id/deliverables/:deliverableId', async (req, res) => {
    const deliverableId = parsePositiveInt(req.params.deliverableId, 'deliverable id');
    const updated = await repository.updatePartnerDeliverable(deliverableId, {
      status: req.body.status || 'COMPLETED',
      notes: req.body.notes,
    });
    if (!updated) throw new NotFoundError('Deliverable not found');
    res.json(updated);
  });

  router.get('/partner-applications/:id/logo', async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const item = await repository.getPartnerApplicationById(id);
    if (!item || !item.logo_key) throw new NotFoundError('Logo not found');
    const mediaService = createPartnerVendorMediaService(config);
    const filePath = mediaService.getFilePath(item.logo_key);
    res.setHeader('Content-Type', item.logo_content_type || 'image/webp');
    res.sendFile(filePath);
  });

  // --- Vendor Applications ---
  router.get('/vendor-applications', async (req, res) => {
    const status = req.query.status || null;
    const search = req.query.search || null;
    const items = await repository.listVendorApplications({ status, search });
    res.json(items);
  });

  router.get('/vendor-applications/export', async (req, res) => {
    const items = await repository.listVendorApplications();
    const headers = [
      'Ref Number', 'Business Name', 'Representative', 'Email', 'Phone',
      'Category', 'Status', 'Electricity', 'Water', 'Staff Count', 'Created At'
    ];
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
    const rows = items.map(item => [
      escapeCsv(item.application_number || `NV-26-V-${item.id}`),
      escapeCsv(item.business_name),
      escapeCsv(item.representative_name || item.contact_name),
      escapeCsv(item.email),
      escapeCsv(item.phone),
      escapeCsv(item.category),
      escapeCsv(item.status),
      escapeCsv(item.electricity_required ? 'Yes' : 'No'),
      escapeCsv(item.water_required ? 'Yes' : 'No'),
      escapeCsv(item.staff_count || 1),
      escapeCsv(item.created_at),
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="nv_cyclothon_vendors.csv"');
    res.send(csvContent);
  });

  router.get('/vendor-applications/:id', async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const item = await repository.getVendorApplicationById(id);
    if (!item) throw new NotFoundError('Vendor application not found');
    res.json(item);
  });

  router.post(['/vendor-applications/:id/review', '/vendor-applications/:id/status'], async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const payload = parseSchema(partnerVendorReviewSchema, req.body);
    const existing = await repository.getVendorApplicationById(id);
    if (!existing) throw new NotFoundError('Vendor application not found');
    const updated = await repository.updateVendorApplicationStatus(id, {
      status: payload.status,
      reviewer: 'admin',
      notes: payload.notes,
    });
    try {
      const normalizedStatus = String(payload.status).toLowerCase();
      if (normalizedStatus === 'approved') {
        await emailService.sendVendorApprovalNotification(updated);
      } else if (normalizedStatus === 'rejected') {
        await emailService.sendVendorRejectionNotification(updated);
      }
    } catch (emailErr) {
      console.error('Vendor review email failed:', emailErr);
    }
    res.json(updated);
  });

  router.get('/vendor-applications/:id/document', async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'application id');
    const item = await repository.getVendorApplicationById(id);
    if (!item || !item.document_key) throw new NotFoundError('Document not found');
    const mediaService = createPartnerVendorMediaService(config);
    const filePath = mediaService.getFilePath(item.document_key);
    res.setHeader('Content-Type', item.document_content_type || 'application/pdf');
    res.sendFile(filePath);
  });

  return router;
}

module.exports = {
  createAdminRouter,
};
