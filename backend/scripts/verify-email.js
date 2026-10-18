#!/usr/bin/env node
const net = require("net");
const path = require("path");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load backend .env
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USERNAME || "";
const pass = (process.env.SMTP_PASSWORD || "").replace(/\s+/g, "");
const from = process.env.SMTP_FROM_EMAIL || user;
const targetRecipient = process.argv[2];

console.log("=================================================");
console.log(" NV CYCLOTHON — TRANSACTIONAL EMAIL DIAGNOSTIC ");
console.log("=================================================");
console.log(`Environment file:  ${envPath}`);
console.log(`Configured Host:   ${host}`);
console.log(`Configured Port:   ${port}`);
console.log(`Configured User:   ${user || "(none)"}`);
console.log(`Configured From:   ${from || "(none)"}`);
console.log(`Password Present:  ${pass ? "YES (" + pass.length + " chars)" : "NO"}`);
console.log("-------------------------------------------------");

function testTcpPort(testHost, testPort) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection(
      {
        host: testHost,
        port: testPort,
        family: 4, // IPv4
        timeout: 7000,
      },
      () => {
        const ms = Date.now() - start;
        socket.end();
        resolve({ ok: true, ms });
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: "ETIMEDOUT (Connection timed out after 7s - likely blocked by VPS host firewall)" });
    });

    socket.on("error", (err) => {
      resolve({ ok: false, error: `${err.code || err.message}` });
    });
  });
}

function verifyNodemailer(testPort, secure) {
  return new Promise((resolve) => {
    const transporter = nodemailer.createTransport({
      host,
      port: testPort,
      secure,
      family: 4,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    transporter.verify((err) => {
      if (err) {
        resolve({ ok: false, error: err.message, code: err.code });
      } else {
        resolve({ ok: true });
      }
    });
  });
}

async function run() {
  console.log("\n[1/3] Testing Outbound TCP Connectivity to Google SMTP (IPv4)...");

  const r587 = await testTcpPort(host, 587);
  console.log(`  • Port 587 (STARTTLS): ${r587.ok ? `[CONNECTED] in ${r587.ms}ms` : `[BLOCKED/TIMEOUT] - ${r587.error}`}`);

  const r465 = await testTcpPort(host, 465);
  console.log(`  • Port 465 (SSL/TLS):  ${r465.ok ? `[CONNECTED] in ${r465.ms}ms` : `[BLOCKED/TIMEOUT] - ${r465.error}`}`);

  if (!r587.ok && !r465.ok) {
    console.log("\n⚠️  WARNING: BOTH Port 587 and Port 465 failed to connect!");
    console.log("This means your VPS hosting provider (DigitalOcean / AWS / Hetzner) is strictly blocking outbound SMTP ports on the host.");
    console.log("Solutions:");
    console.log("  Option A: On DigitalOcean, file a support ticket asking to unblock outbound SMTP ports for transactional mail.");
    console.log("  Option B: Set RESEND_API_KEY=re_... in .env to send via HTTPS on port 443 (never blocked).");
    return;
  }

  console.log("\n[2/3] Verifying SMTP Authentication...");
  if (r465.ok) {
    const v465 = await verifyNodemailer(465, true);
    console.log(`  • SMTPS Port 465 Auth: ${v465.ok ? "[AUTHENTICATED]" : `[FAILED] - ${v465.error}`}`);
  }
  if (r587.ok) {
    const v587 = await verifyNodemailer(587, false);
    console.log(`  • SMTP Port 587 Auth:  ${v587.ok ? "[AUTHENTICATED]" : `[FAILED] - ${v587.error}`}`);
  }

  if (targetRecipient) {
    console.log(`\n[3/3] Sending Live Test Email to ${targetRecipient}...`);
    const preferredPort = r465.ok ? 465 : 587;
    const transporter = nodemailer.createTransport({
      host,
      port: preferredPort,
      secure: preferredPort === 465,
      family: 4,
      auth: { user, pass },
      connectionTimeout: 12000,
    });

    try {
      const info = await transporter.sendMail({
        from: from,
        to: targetRecipient,
        subject: "NV Cyclothon — Transactional Email Test",
        text: "This is a test transactional email from NV Cyclothon 2026. If you received this, your email delivery pipeline is 100% operational!",
        html: `
          <div style="font-family:sans-serif;padding:20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
            <h2 style="color:#0f172a;margin-top:0;">NV Cyclothon 2026 — Email Delivery Test</h2>
            <p style="color:#334155;">Congratulations! Your transactional email service is working properly.</p>
            <p style="font-size:12px;color:#64748b;">Sent via port <strong>${preferredPort}</strong> at ${new Date().toISOString()}</p>
          </div>
        `,
      });
      console.log(`  ✅ Test email delivered successfully! Message ID: ${info.messageId}`);
    } catch (sendErr) {
      console.error(`  ❌ Test email sending failed:`, sendErr.message);
    }
  } else {
    console.log("\n[3/3] Live Test Email: Skipped (Provide recipient as argument: node scripts/verify-email.js recipient@gmail.com)");
  }

  console.log("\n=================================================");
  console.log(" DIAGNOSTIC COMPLETE ");
  console.log("=================================================\n");
}

run().catch(console.error);
