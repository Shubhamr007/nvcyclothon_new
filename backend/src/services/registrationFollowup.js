const crypto = require("crypto");

function needsRegistrationFollowup(registration) {
  const isMissing = (value) => !String(value || "").trim();
  return isMissing(registration.address_line1) || isMissing(registration.state) ||
    isMissing(registration.postal_code) || isMissing(registration.emergency_contact) ||
    (Number(registration.age) < 18 && (
      isMissing(registration.guardian_name) || isMissing(registration.guardian_relationship) ||
      isMissing(registration.guardian_email) || isMissing(registration.guardian_phone)
    ));
}

async function sendRegistrationFollowupLink({ config, repository, emailService, registration }) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const stored = await repository.upsertRegistrationFollowupToken(registration.id, tokenHash, expiresAt);
  if (!stored) return { sent: false, formUrl: null, expiresAt };
  const formUrl = `${config.publicSiteUrl}/registration-details/${token}`;
  const sent = await emailService.sendRegistrationFollowup({
    recipient: registration.email,
    name: registration.full_name,
    registrationId: registration.id,
    formUrl,
    expiresAt,
  });
  await repository.recordEmailDelivery({
    registrationId: registration.id,
    emailType: "registration_followup",
    recipient: registration.email,
    subject: "Complete your NV Cyclothon 2026 participant details",
    sent: Boolean(sent),
    status: config.emailEnabled ? (sent ? "sent" : "failed") : "disabled",
  });
  return { sent: Boolean(sent), formUrl, expiresAt };
}

module.exports = { sendRegistrationFollowupLink, needsRegistrationFollowup };
