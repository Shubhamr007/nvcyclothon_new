const nodemailer = require("nodemailer");
const QRCode = require("qrcode");

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

  async function send({ recipient, subject, text, html, attachment }) {
    if (!config.emailEnabled) {
      logger.info(`Email disabled; skipped transactional message type=${subject}`);
      return;
    }
    const message = {
      from: config.smtpFromEmail,
      to: recipient,
      subject,
      text,
      html,
      attachments: attachment
        ? [
            {
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.contentType,
            },
          ]
        : undefined,
    };

    try {
      await getTransporter().sendMail(message);
    } catch (error) {
      logger.error("Transactional email delivery failed", error);
    }
  }

  return {
    async sendRegistrationConfirmation({ recipient, registration, checkinQrPrefix = "" }) {
      const riderId = registration?.id;
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
      const text = `Hi ${name},\n\nYour NV Cyclothon registration is confirmed after successful payment.\n\nRider ID: #${riderId}\nRoute: ${route}\nAmount paid: ${amount}\nRace day: 18 October 2026\nReporting time: 5:30 AM\nVenue: Rewa, Madhya Pradesh\n\nRace-day check-in code: ${checkinPayload || "Will be shared by event desk"}\n\nPlease keep this email handy on race day.\n\nNV Cyclothon, in association with Rewa Cycling Federation`;
      const qrMarkup = qrCodeDataUrl
        ? `<p><img src="${qrCodeDataUrl}" alt="Race day check-in QR code" width="220" height="220" /></p>`
        : "";
      const html = `<h1>You are on the list.</h1><p>Hi ${escapeHtml(name)},</p><p>Your NV Cyclothon registration is confirmed after successful payment.</p><ul><li><strong>Rider ID:</strong> #${riderId}</li><li><strong>Route:</strong> ${escapeHtml(route)}</li><li><strong>Amount paid:</strong> ${escapeHtml(amount)}</li><li><strong>Race day:</strong> 18 October 2026</li><li><strong>Reporting time:</strong> 5:30 AM</li><li><strong>Venue:</strong> Rewa, Madhya Pradesh</li></ul><p><strong>Race-day check-in code:</strong> ${escapeHtml(checkinPayload || "Will be shared by event desk")}</p>${qrMarkup}<p>Please keep this email handy on race day.</p><p>NV Cyclothon, in association with Rewa Cycling Federation</p>`;
      await send({ recipient, subject, text, html });
    },

    async sendPaymentReceipt({ recipient, name, orderId, totalPaise }) {
      const total = `Rs ${Number(totalPaise) / 100}`;
      const subject = `Payment receipt for order #${orderId}`;
      const text = `Hi ${name},\n\nWe received payment of ${total} for order #${orderId}. Keep this email as your receipt.`;
      const html = `<h1>Payment received</h1><p>Hi ${escapeHtml(name)},</p><p>We received <strong>${escapeHtml(total)}</strong> for order <strong>#${escapeHtml(orderId)}</strong>.</p>`;
      await send({ recipient, subject, text, html });
    },

    async sendEventUpdate({ recipients, subject, message }) {
      for (const recipient of recipients) {
        await send({
          recipient,
          subject,
          text: message,
          html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
        });
      }
    },

    async sendParticipationCertificate({ recipient, name, riderId, route, certificatePdf }) {
      const subject = "Congratulations on completing NV Cyclothon 2026";
      const text = `Hi ${name},\n\nCongratulations and thank you for participating in NV Cyclothon 2026. Your participation certificate for the ${route} route is attached. Rider ID: #${riderId}.\n\nWe hope to see you on the road again soon!\n\nNV Cyclothon`;
      const html = `<h1>Congratulations!</h1><p>Hi ${name},</p><p>Thank you for participating in NV Cyclothon 2026. Your participation certificate for the <strong>${route}</strong> route is attached.</p><p>Your rider ID is <strong>#${riderId}</strong>.</p><p>We hope to see you on the road again soon!</p><p>NV Cyclothon</p>`;
      await send({
        recipient,
        subject,
        text,
        html,
        attachment: {
          filename: `nv-cyclothon-certificate-${riderId}.pdf`,
          content: certificatePdf,
          contentType: "application/pdf",
        },
      });
    },
  };
}

module.exports = {
  createEmailService,
};
