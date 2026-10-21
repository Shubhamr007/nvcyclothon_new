const { generateParticipationCertificate, generateRiderPassPdf, riderId } = require("./eventDocuments");
const { getOrCreatePdf } = require("./documentStorage");

const DOCUMENT_VERSION = "v2";

function mapConcurrency(items, limit, fn) {
  let index = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  });
  return Promise.all(workers).then(() => results);
}

async function getCachedRiderPass(config, repository, registration, checkinPayload, settings = null) {
  const siteSettings = settings || (await repository.getSiteSettings());
  return getOrCreatePdf({
    rootDirectory: config.uploadDir,
    directory: "generated-documents",
    filename: `rider-pass-${DOCUMENT_VERSION}-${registration.id}.pdf`,
    generate: () =>
      generateRiderPassPdf({
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
    generate: () =>
      generateParticipationCertificate({
        templatePath: config.certificateTemplatePath,
        registration,
        eventDate: siteSettings.event_date,
        venue: siteSettings.event_location,
      }),
  });
}

async function recordDelivery(config, repository, registration, emailType, subject, sent) {
  if (!repository.recordEmailDelivery) return;
  await repository.recordEmailDelivery({
    registrationId: registration.id,
    emailType,
    recipient: registration.email,
    subject,
    sent,
    status: config.emailEnabled ? (sent ? "sent" : "failed") : "disabled",
  });
}

function registerStandardJobHandlers(queue, { config, repository, emailService }) {
  queue.registerHandler("certificates_generate", async (job, { updateProgress, signal }) => {
    const ids = Array.isArray(job.payload?.registration_ids) ? job.payload.registration_ids : [];
    const [settings, registrations] = await Promise.all([
      repository.getSiteSettings(),
      repository.getRegistrationsByIds(ids),
    ]);
    const eligible = registrations.filter((item) => item.status === "checked_in");
    const sentIds = [];
    const failedIds = [];
    let completedCount = 0;

    await mapConcurrency(eligible, 3, async (registration) => {
      if (signal.aborted) return;
      const certificatePdf = await getCachedCertificate(config, repository, registration, settings);
      const sent = await emailService.sendParticipationCertificate({
        recipient: registration.email,
        name: registration.full_name,
        riderId: riderId(registration),
        route: registration.ride_category,
        certificatePdf,
      });
      await repository.recordParticipationCertificate(registration.id, sent);
      await recordDelivery(config, repository, registration, "certificate", "Congratulations on completing NV Cyclothon 2026", sent);
      (sent ? sentIds : failedIds).push(registration.id);

      completedCount++;
      const progress = Math.round((completedCount / (eligible.length || 1)) * 100);
      await updateProgress(progress, {
        current: completedCount,
        total: eligible.length,
        sent: sentIds.length,
        failed: failedIds.length,
      });
    });

    const queuedIds = eligible.map((item) => item.id);
    return {
      queued: eligible.length,
      queued_ids: queuedIds,
      sent_ids: sentIds,
      failed_ids: failedIds,
      skipped: registrations.length - eligible.length,
      skipped_ids: registrations.filter((item) => !queuedIds.includes(item.id)).map((item) => item.id),
      missing_ids: ids.filter((id) => !registrations.some((item) => item.id === id)),
    };
  });

  queue.registerHandler("passes_generate", async (job, { updateProgress, signal }) => {
    const ids = Array.isArray(job.payload?.registration_ids) ? job.payload.registration_ids : [];
    const [settings, registrations] = await Promise.all([
      repository.getSiteSettings(),
      repository.getRegistrationsByIds(ids),
    ]);
    const eligible = registrations.filter((item) => item.payment_status === "paid" && item.status !== "cancelled");
    const sentIds = [];
    const failedIds = [];
    let completedCount = 0;

    await mapConcurrency(eligible, 3, async (registration) => {
      if (signal.aborted) return;
      const checkinPayload = registration.checkin_token
        ? `${config.checkinQrPrefix}${registration.checkin_token}`
        : "";
      const riderPassPdf = await getCachedRiderPass(config, repository, registration, checkinPayload, settings);
      const sent = await emailService.sendRiderPass({ recipient: registration.email, registration, riderPassPdf });
      await repository.recordRiderPass(registration.id, sent);
      await recordDelivery(config, repository, registration, "rider_pass", "Your official NV Cyclothon 2026 rider pass", sent);
      (sent ? sentIds : failedIds).push(registration.id);

      completedCount++;
      const progress = Math.round((completedCount / (eligible.length || 1)) * 100);
      await updateProgress(progress, {
        current: completedCount,
        total: eligible.length,
        sent: sentIds.length,
        failed: failedIds.length,
      });
    });

    const queuedIds = eligible.map((item) => item.id);
    return {
      queued: eligible.length,
      queued_ids: queuedIds,
      sent_ids: sentIds,
      failed_ids: failedIds,
      skipped: registrations.length - eligible.length,
      skipped_ids: registrations.filter((item) => !queuedIds.includes(item.id)).map((item) => item.id),
      missing_ids: ids.filter((id) => !registrations.some((item) => item.id === id)),
    };
  });

  queue.registerHandler("event_update_email", async (job, { updateProgress }) => {
    const { subject, message, filter_category } = job.payload || {};
    let recipients = await repository.listRegistrationEmails();

    if (filter_category && filter_category !== "all" && repository.listRegistrations) {
      const allRegs = await repository.listRegistrations();
      const matchedEmails = new Set(
        allRegs
          .filter((r) => r.ride_category === filter_category && r.payment_status === "paid")
          .map((r) => String(r.email || "").trim().toLowerCase())
      );
      recipients = recipients.filter((e) => matchedEmails.has(String(e || "").trim().toLowerCase()));
    }

    await updateProgress(15, { status_text: "Preparing broadcast recipient list..." });
    await emailService.sendEventUpdate({
      recipients,
      subject,
      message,
    });
    await updateProgress(100, { status_text: "Broadcast email sent successfully" });

    return {
      queued_recipients: recipients.length,
      subject,
      category: filter_category || "all",
    };
  });

  return queue;
}

module.exports = {
  registerStandardJobHandlers,
  getCachedRiderPass,
  getCachedCertificate,
};
