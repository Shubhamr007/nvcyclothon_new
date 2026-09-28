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

  let cachedBanner = null;
  async function bannerAttachment() {
    if (cachedBanner) {
      return cachedBanner;
    }
    try {
      cachedBanner = {
        filename: "nv-cyclothon-email-banner.png",
        content: await fs.readFile(config.emailBannerImagePath),
        contentType: "image/png",
        cid: "nv-cyclothon-email-banner",
        contentDisposition: "inline",
      };
      return cachedBanner;
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

  async function sendPartnerApplicationConfirmation(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-P-${application.id}`;
    const body = `<p style="font-size:16px;line-height:1.55">Thank you for your interest in partnering with NV Cyclothon 2026!</p>
      <p style="font-size:16px;line-height:1.55">We have received your partner application for <strong>${escapeHtml(application.company_name)}</strong>. Our partnership team will review your application and contact you regarding availability and next steps.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>
      <p style="font-size:14px;line-height:1.55;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:15px">
        Event: NV Cyclothon — 3rd Edition<br/>
        Date: 22 November 2026 • Rewa, Madhya Pradesh<br/>
        Contact: Aman Mishra, Joint Secretary, RDCA (+91 88395 03099 | nvcyclothon@gmail.com)
      </p>`;
    return send({
      recipient: application.email,
      subject: `Partner Application Received [${refNum}] — NV Cyclothon 2026`,
      text: `Thank you for your partner application for ${application.company_name}. Reference Number: ${refNum}. Our partnership team will review your application and contact you shortly. Contact: Aman Mishra, RDCA (+91 88395 03099).`,
      html: emailShell({ title: "You're in the Ride.", greeting: application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
  }

  async function sendPartnerApprovalNotification(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-P-${application.id}`;
    const body = `<p style="font-size:16px;line-height:1.55">We are delighted to inform you that your partner application for <strong>${escapeHtml(application.company_name)}</strong> has been <span style="color:#22c55e;font-weight:bold">approved</span>!</p>
      <p style="font-size:16px;line-height:1.55">Welcome aboard as an official partner for NV Cyclothon 2026. Our team will reach out with next steps regarding branding deliverables, artwork collection, and event coordination.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>
      <p style="font-size:14px;line-height:1.55;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:15px">
        Event: NV Cyclothon — 3rd Edition<br/>
        Date: 22 November 2026 • Rewa, Madhya Pradesh<br/>
        Contact: Aman Mishra, Joint Secretary, RDCA (+91 88395 03099)
      </p>`;
    return send({
      recipient: application.email,
      subject: `Partner Application Approved [${refNum}] — NV Cyclothon 2026`,
      text: `Your partner application for ${application.company_name} has been approved! Reference Number: ${refNum}. Our team will contact you with next steps.`,
      html: emailShell({ title: 'Welcome, Partner!', greeting: application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
  }

  async function sendPartnerRejectionNotification(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-P-${application.id}`;
    const notes = application.review_notes ? `<p style="font-size:15px;line-height:1.55;color:#666">Feedback / Reason: ${escapeHtml(application.review_notes)}</p>` : '';
    const body = `<p style="font-size:16px;line-height:1.55">Thank you for your interest in partnering with NV Cyclothon 2026. After careful review, we are unable to accommodate your application for <strong>${escapeHtml(application.company_name)}</strong> at this time.</p>${notes}
      <p style="font-size:16px;line-height:1.55">We appreciate your support and encourage you to connect with us for future editions and collaborations.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>`;
    return send({
      recipient: application.email,
      subject: `Partner Application Update [${refNum}] — NV Cyclothon 2026`,
      text: `Your partner application for ${application.company_name} could not be accommodated at this time. Reference Number: ${refNum}. ${application.review_notes || ''}`,
      html: emailShell({ title: 'Application Update', greeting: application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
  }

  async function sendVendorApplicationConfirmation(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-V-${application.id}`;
    const body = `<p style="font-size:16px;line-height:1.55">Thank you for applying as an event vendor for NV Cyclothon 2026!</p>
      <p style="font-size:16px;line-height:1.55">We have received your vendor application for <strong>${escapeHtml(application.business_name)}</strong> in the <strong>${escapeHtml(application.category)}</strong> category.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>
      <p style="font-size:14px;line-height:1.55;color:#555">Vendor requirements, space allocation and commercial terms will be discussed during application review.</p>
      <p style="font-size:14px;line-height:1.55;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:15px">
        Event: NV Cyclothon — 3rd Edition<br/>
        Date: 22 November 2026 • Rewa, Madhya Pradesh<br/>
        Contact: Aman Mishra, Joint Secretary, RDCA (+91 88395 03099 | nvcyclothon@gmail.com)
      </p>`;
    return send({
      recipient: application.email,
      subject: `Vendor Application Received [${refNum}] — NV Cyclothon 2026`,
      text: `Thank you for your vendor application for ${application.business_name}. Reference Number: ${refNum}. Vendor requirements and terms will be discussed during review.`,
      html: emailShell({ title: 'Application Received', greeting: application.representative_name || application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
  }

  async function sendVendorApprovalNotification(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-V-${application.id}`;
    const body = `<p style="font-size:16px;line-height:1.55">We are pleased to inform you that your vendor application for <strong>${escapeHtml(application.business_name)}</strong> has been <span style="color:#22c55e;font-weight:bold">approved</span>!</p>
      <p style="font-size:16px;line-height:1.55">Welcome to NV Cyclothon 2026. Our operations team will contact you regarding space allocation, setup schedule, and event-day guidelines.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>
      <p style="font-size:14px;line-height:1.55;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:15px">
        Event: NV Cyclothon — 3rd Edition<br/>
        Date: 22 November 2026 • Rewa, Madhya Pradesh<br/>
        Contact: Aman Mishra, Joint Secretary, RDCA (+91 88395 03099)
      </p>`;
    return send({
      recipient: application.email,
      subject: `Vendor Application Approved [${refNum}] — NV Cyclothon 2026`,
      text: `Your vendor application for ${application.business_name} has been approved! Reference Number: ${refNum}. Our team will contact you regarding stall allocation.`,
      html: emailShell({ title: 'Welcome, Vendor!', greeting: application.representative_name || application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
  }

  async function sendVendorRejectionNotification(application) {
    const banner = await bannerAttachment();
    const refNum = application.application_number || `NV-26-V-${application.id}`;
    const notes = application.review_notes ? `<p style="font-size:15px;line-height:1.55;color:#666">Feedback / Reason: ${escapeHtml(application.review_notes)}</p>` : '';
    const body = `<p style="font-size:16px;line-height:1.55">Thank you for your interest in joining NV Cyclothon 2026 as an event vendor. After careful review, we are unable to accommodate your application for <strong>${escapeHtml(application.business_name)}</strong> at this time.</p>${notes}
      <p style="font-size:16px;line-height:1.55">We appreciate your interest and hope to work with you in future editions.</p>
      <p style="font-size:15px;line-height:1.55;color:#666">Reference Number: <strong>${escapeHtml(refNum)}</strong></p>`;
    return send({
      recipient: application.email,
      subject: `Vendor Application Update [${refNum}] — NV Cyclothon 2026`,
      text: `Your vendor application for ${application.business_name} could not be accommodated at this time. Reference Number: ${refNum}. ${application.review_notes || ''}`,
      html: emailShell({ title: 'Application Update', greeting: application.representative_name || application.contact_name, body, banner: !!banner }),
      attachments: banner ? [banner] : [],
    });
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

    async sendVolunteerCredentials({ recipient, name, volunteerId, password, role, checkinUrl }) {
      const banner = await bannerAttachment();
      const portalUrl = checkinUrl || `${config.appBaseUrl || "https://nvcyclothon.com"}/checkin`;
      const subject = "Your NV Cyclothon 2026 Volunteer Login Credentials";
      const text = `Hi ${name},\n\nThank you for volunteering for NV Cyclothon 2026!\n\nHere are your event-day login credentials:\nVolunteer ID: ${volunteerId}\nPassword: ${password}\nAssigned Role: ${role || "Check-in Desk"}\n\nLogin Portal: ${portalUrl}\n\nPlease keep these credentials safe and carry your smartphone on event day to log in and scan rider passes.\n\nWarm regards,\nNV Cyclothon Organizing Committee`;
      const html = emailShell({
        title: "Volunteer Team Access",
        greeting: name,
        banner,
        body: `<p>Thank you for stepping up to power <strong>NV Cyclothon 2026</strong>! Your dedication and hard work make this grand athletic event possible.</p>
        <div style="background:#f4f6f8;border-left:4px solid #071313;padding:16px;margin:20px 0;border-radius:8px;">
          <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;color:#555;font-weight:bold;">Your Event-Day Credentials</p>
          <p style="margin:4px 0;font-size:15px;"><strong>Volunteer ID:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid #ddd;font-weight:bold;color:#071313;">${escapeHtml(volunteerId)}</code></p>
          <p style="margin:4px 0;font-size:15px;"><strong>Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid #ddd;font-weight:bold;color:#ff5f3d;">${escapeHtml(password)}</code></p>
          <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Assigned Role / Station:</strong> ${escapeHtml(role || "Check-in Desk")}</p>
        </div>
        <p style="margin-top:16px;">
          <a href="${escapeHtml(portalUrl)}" style="background:#071313;color:#d9ff38;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Open Volunteer Check-In Portal</a>
        </p>
        <p style="font-size:12px;color:#666;margin-top:20px;">Please carry your smartphone on race day to scan participant passes and assist riders.</p>`,
      });
      return send({ recipient, subject, text, html, attachments: banner ? [banner] : [] });
    },

    async sendVolunteerCertificate({ recipient, name, role, certificatePdf }) {
      const banner = await bannerAttachment();
      const subject = "Certificate of Appreciation - NV Cyclothon 2026 Volunteer Team";
      const text = `Dear ${name},\n\nThank you for your tireless contribution and outstanding service as a volunteer for NV Cyclothon 2026. Your official Certificate of Appreciation is attached to this email.\n\nWith immense gratitude,\nNV Cyclothon Organizing Committee`;
      const html = emailShell({
        title: "Certificate of Appreciation",
        greeting: name,
        banner,
        body: `<p>On behalf of the entire organizing committee and riders, we extend our deepest gratitude for your selfless contribution and support during <strong>NV Cyclothon 2026</strong>.</p>
        <p>Your official <strong>Certificate of Appreciation</strong> is attached to this email in recognition of your dedicated service in the role of <strong>${escapeHtml(role || "Event Operations")}</strong>.</p>
        <p>We are proud to have had you on the team!</p>`,
      });
      return send({
        recipient,
        subject,
        text,
        html,
        attachments: [...(banner ? [banner] : []), {
          filename: `nv-cyclothon-volunteer-certificate-${String(name).toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`,
          content: certificatePdf,
          contentType: "application/pdf",
        }],
      });
    },

    sendPartnerApplicationConfirmation,
    sendPartnerApprovalNotification,
    sendPartnerRejectionNotification,
    sendVendorApplicationConfirmation,
    sendVendorApprovalNotification,
    sendVendorRejectionNotification,
  };
}

module.exports = {
  createEmailService,
  generateRiderPass: generateRiderPassPdf,
};
