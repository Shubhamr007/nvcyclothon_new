const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const { parse: parseCsv } = require("csv-parse/sync");
const ExcelJS = require("exceljs");
const pdfParse = require("pdf-parse");
const { generateParticipationCertificate } = require("../services/certificates");
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
  delegationSchema,
  eventUpdateEmailSchema,
  siteSettingsPatchSchema,
  communityModerationSchema,
  normalizeOfferInput,
  normalizeChiefGuestInput,
  normalizeDelegationInput,
} = require("../services/validation");
const { deleteCommunityImage } = require("../services/communityMedia");

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function parsePositiveInt(value, fieldName) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
  return parsed;
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
    res.json(analytics);
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
      const { resolveCommunityImagePath } = require("../services/communityMedia");
      const target = resolveCommunityImagePath(config, req.params.key);
      if (!target) {
        throw new NotFoundError("Media not found");
      }
      res.set("Cache-Control", "private, no-store");
      res.type("image/webp").sendFile(target);
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
      eligible.map((registration) =>
        emailService.sendParticipationCertificate({
          recipient: registration.email,
          name: registration.full_name,
          riderId: registration.id,
          route: registration.ride_category,
          certificatePdf: req.file.buffer,
        })
      )
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

    const registrations = await repository.getRegistrationsByIds(ids);
    const eligible = registrations.filter((item) => item.status === "checked_in");

    for (const registration of eligible) {
      const certificatePdf = await generateParticipationCertificate({
        name: registration.full_name,
        riderId: registration.id,
        route: registration.ride_category,
      });
      await emailService.sendParticipationCertificate({
        recipient: registration.email,
        name: registration.full_name,
        riderId: registration.id,
        route: registration.ride_category,
        certificatePdf,
      });
    }

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

    const certificatePdf = await generateParticipationCertificate({
      name: registration.full_name,
      riderId: registration.id,
      route: registration.ride_category,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"nv-cyclothon-certificate-${registration.id}.pdf\"`
    );
    res.send(certificatePdf);
  });

  router.patch("/registrations/:registrationId", async (req, res) => {
    const registrationId = parsePositiveInt(req.params.registrationId, "registration id");
    const payload = parseSchema(statusUpdateSchema, req.body);
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

  return router;
}

module.exports = {
  createAdminRouter,
};
