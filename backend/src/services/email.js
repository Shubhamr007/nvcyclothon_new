const nodemailer = require("nodemailer");
const fs = require("fs/promises");
const QRCode = require("qrcode");
const { generateRiderPassPdf, riderId } = require("./eventDocuments");

function formatRupees(totalPaise) {
  const value = Number(totalPaise);
  if (!Number.isFinite(value)) {
    return "Rs 0";
  }
  return `Rs ${(value / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailShell({ title, greeting, body, banner }) {
  const bannerMarkup = banner
    ? '<img src="cid:nv-cyclothon-email-banner" alt="NV Cyclothon 2026" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:0" />'
    : "";
  return `<div style="margin:0;padding:24px;background:#f4f1e9;font-family:Arial,sans-serif;color:#071313"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#fff;border-radius:18px;overflow:hidden"><tr><td>${bannerMarkup}</td></tr><tr><td style="padding:30px"><h1 style="margin:0 0 18px;font-size:28px">${escapeHtml(title)}</h1><p style="font-size:16px;line-height:1.55">Hi ${escapeHtml(greeting)},</p>${body}<p style="margin:24px 0 0;font-size:14px;line-height:1.55">NV Cyclothon<br/>Ride for Vindhya</p></td></tr></table></td></tr></table></div>`;
}

function createEmailService(config, logger = console) {
  let transporter = null;

  function getTransporter() {
    if (transporter) {
      return transporter;
    }
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false,
      auth: config.smtpUsername
        ? {
            user: config.smtpUsername,
            pass: config.smtpPassword,
          }
        : undefined,
      requireTLS: config.smtpUseTls,
    });
    return transporter;
  }

  async function bannerAttachment() {
    try {
      return {
        filename: "nv-cyclothon-email-banner.png",
        content: await fs.readFile(config.emailBannerImagePath),
        contentType: "image/png",
        cid: "nv-cyclothon-email-banner",
        contentDisposition: "inline",
      };
    } catch (error) {
      logger.error("Unable to load the email banner", error);
      return null;
    }
  }

  async function send({ recipient, subject, text, html, attachments = [] }) {
    if (!config.emailEnabled) {
      logger.info(`Email disabled; skipped transactional message type=${subject}`);
      return false;
    }
    const message = {
      from: config.smtpFromEmail,
      to: recipient,
      subject,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    };

    try {
      await getTransporter().sendMail(message);
      return true;
    } catch (error) {
      logger.error("Transactional email delivery failed", {
        code: error.code,
        command: error.command,
        message: error.message,
        recipient,
        responseCode: error.responseCode,
        subject,
      });
      return false;
    }
  }

  return {
    async sendRegistrationConfirmation({ recipient, registration, checkinQrPrefix = "", eventDate = "2026-11-22", eventLocation = "Rewa, Madhya Pradesh", eventStartTime = "5:30 AM" }) {
      const passRiderId = riderId(registration);
      const name = registration?.full_name || "Rider";
      const route = registration?.ride_category || "NV Cyclothon ride";
      const amount = formatRupees(registration?.registration_fee_paise);
      const checkinToken = registration?.checkin_token || "";
      const checkinPayload = checkinToken
        ? `${String(checkinQrPrefix || "nvcyclothon-checkin:")}${checkinToken}`
        : "";

      let qrCodeDataUrl = "";
      if (checkinPayload) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(checkinPayload, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 240,
          });
        } catch (error) {
          logger.error("Unable to generate check-in QR code", error);
        }
      }

      const subject = "Your NV Cyclothon 2026 registration is confirmed";
      const formattedDate = new Date(`${eventDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
      const text = `Hi ${name},\n\nYour NV Cyclothon registration is confirmed after successful payment.\n\nRider ID: ${passRiderId}\nRoute: ${route}\nAmount paid: ${amount}\nRace day: ${formattedDate}\nReporting time: ${eventStartTime}\nVenue: ${eventLocation}\n\nRace-day check-in code: ${checkinPayload || "Will be shared by event desk"}\n\nPlease keep this email handy on race day.\n\nNV Cyclothon, in association with Rewa Cycling Federation`;
      const qrMarkup = qrCodeDataUrl
        ? `<p><img src="${qrCodeDataUrl}" alt="Race day check-in QR code" width="220" height="220" /></p>`
        : "";
      const banner = await bannerAttachment();
      const html = emailShell({ title: "Your registration is confirmed", greeting: name, banner, body: `<p>Your NV Cyclothon registration and payment are confirmed. Your rider pass will be sent separately by the event team.</p><ul><li><strong>Rider ID:</strong> ${escapeHtml(passRiderId)}</li><li><strong>Route:</strong> ${escapeHtml(route)}</li><li><strong>Amount paid:</strong> ${escapeHtml(amount)}</li><li><strong>Event date:</strong> ${escapeHtml(formattedDate)}</li><li><strong>Reporting time:</strong> ${escapeHtml(eventStartTime)}</li><li><strong>Venue:</strong> ${escapeHtml(eventLocation)}</li></ul>${qrMarkup}<p>Please retain this confirmation for your records.</p>` });
      return send({ recipient, subject, text, html, attachments: banner ? [banner] : [] });
    },

    async sendRiderPass({ recipient, registration, riderPassPdf }) {
      const name = registration.full_name || "Rider";
      const banner = await bannerAttachment();
      const subject = "Your official NV Cyclothon 2026 rider pass";
      const text = `Hi ${name},\n\nYour official rider pass is attached. Please carry it along with a valid photo ID on event day.\n\nRider ID: ${riderId(registration)}\nRoute: ${registration.ride_category}\n\nNV Cyclothon`;
      const html = emailShell({ title: "Your rider pass is ready", greeting: name, banner, body: `<p>Your official rider pass is attached to this email. Please carry it, along with a valid photo ID, for event-day check-in.</p><p><strong>Rider ID:</strong> ${escapeHtml(riderId(registration))}<br/><strong>Route:</strong> ${escapeHtml(registration.ride_category)}</p>` });
      return send({ recipient, subject, text, html, attachments: [...(banner ? [banner] : []), { filename: `nv-cyclothon-rider-pass-${registration.id}.pdf`, content: riderPassPdf, contentType: "application/pdf" }] });
    },

    async sendPaymentReceipt({ recipient, name, orderId, totalPaise }) {
      const total = `Rs ${Number(totalPaise) / 100}`;
      const subject = `Payment receipt for order #${orderId}`;
      const text = `Hi ${name},\n\nWe received payment of ${total} for order #${orderId}. Keep this email as your receipt.`;
      const html = `<h1>Payment received</h1><p>Hi ${escapeHtml(name)},</p><p>We received <strong>${escapeHtml(total)}</strong> for order <strong>#${escapeHtml(orderId)}</strong>.</p>`;
      return send({ recipient, subject, text, html });
    },

    async sendEventUpdate({ recipients, subject, message }) {
      for (const recipient of recipients) {
        await send({
          recipient,
          subject,
          text: message,
          html: emailShell({ title: subject, greeting: "Rider", body: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` }),
        });
      }
    },

    async sendParticipationCertificate({ recipient, name, riderId, route, certificatePdf }) {
      const subject = "Congratulations on completing NV Cyclothon 2026";
      const text = `Hi ${name},\n\nCongratulations and thank you for participating in NV Cyclothon 2026. Your participation certificate for the ${route} route is attached. Rider ID: #${riderId}.\n\nWe hope to see you on the road again soon!\n\nNV Cyclothon`;
      const banner = await bannerAttachment();
      const html = emailShell({ title: "Congratulations, rider!", greeting: name, banner, body: `<p>Thank you for participating in NV Cyclothon 2026. Your participation certificate for the <strong>${escapeHtml(route)}</strong> route is attached.</p><p>Your rider ID is <strong>${escapeHtml(riderId)}</strong>.</p><p>We hope to see you on the road again soon.</p>` });
      return send({
        recipient,
        subject,
        text,
        html,
        attachments: [...(banner ? [banner] : []), {
          filename: `nv-cyclothon-certificate-${riderId}.pdf`,
          content: certificatePdf,
          contentType: "application/pdf",
        }],
      });
    },
  };
}

module.exports = {
  createEmailService,
  generateRiderPass: generateRiderPassPdf,
};
