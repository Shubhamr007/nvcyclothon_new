const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ENV_PATH = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(ENV_PATH)) {
  dotenv.config({ path: ENV_PATH });
}

function parseBool(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  return String(value).trim().toLowerCase() === "true";
}

function parseIntWithDefault(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return databaseUrl;
  }
  if (databaseUrl.startsWith("postgresql+psycopg://")) {
    return databaseUrl.replace("postgresql+psycopg://", "postgres://");
  }
  if (databaseUrl.startsWith("postgresql://")) {
    return databaseUrl.replace("postgresql://", "postgres://");
  }
  return databaseUrl;
}

function parseCsv(value, fallback) {
  const resolved = value || fallback;
  return resolved
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseVolunteerCredentials(value) {
  if (!value) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("VOLUNTEER_CHECKIN_CREDENTIALS must be valid JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("VOLUNTEER_CHECKIN_CREDENTIALS must be a JSON object");
  }

  const normalized = {};
  for (const [name, pin] of Object.entries(parsed)) {
    const volunteerName = String(name || "").trim();
    const volunteerPin = String(pin || "").trim();
    if (!volunteerName || !volunteerPin) {
      continue;
    }
    normalized[volunteerName] = volunteerPin;
  }
  return normalized;
}

function loadConfig(env = process.env) {
  const environment = String(env.ENVIRONMENT || env.NODE_ENV || "development").toLowerCase();
  const dbBackend = String(env.DB_BACKEND || (environment === "test" ? "mock" : "postgres")).toLowerCase();
  const databaseUrl = normalizeDatabaseUrl(env.DATABASE_URL || "postgres://nv_cyclothon:nv_cyclothon@127.0.0.1:5432/nv_cyclothon");

  if (dbBackend !== "mock" && dbBackend !== "postgres") {
    throw new Error("DB_BACKEND must be either 'mock' or 'postgres'");
  }
  if (dbBackend === "postgres" && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must use PostgreSQL for DB_BACKEND=postgres");
  }

  const config = {
    appName: env.APP_NAME || "NV Cyclothon API",
    environment,
    nodeEnv: env.NODE_ENV || environment,
    port: parseIntWithDefault(env.PORT, 8000),
    dbBackend,
    databaseUrl,
    uploadDir: path.resolve(__dirname, "..", env.UPLOAD_DIR || "uploads"),
    allowedOrigins: parseCsv(env.ALLOWED_ORIGINS, "http://localhost:5173"),
    allowedHosts: parseCsv(env.ALLOWED_HOSTS, "localhost,127.0.0.1"),
    adminAuthEnabled: parseBool(env.ADMIN_AUTH_ENABLED, environment === "production"),
    adminApiKey: env.ADMIN_API_KEY || "change-me-before-production",
    adminSessionTtlSeconds: parseIntWithDefault(env.ADMIN_SESSION_TTL_SECONDS, 900),
    volunteerCheckinEnabled: parseBool(env.VOLUNTEER_CHECKIN_ENABLED, true),
    volunteerCheckinPin: env.VOLUNTEER_CHECKIN_PIN || "",
    volunteerCheckinCredentials: parseVolunteerCredentials(
      env.VOLUNTEER_CHECKIN_CREDENTIALS
    ),
    volunteerSessionTtlSeconds: parseIntWithDefault(
      env.VOLUNTEER_SESSION_TTL_SECONDS,
      8 * 60 * 60
    ),
    volunteerTokenSecret:
      env.VOLUNTEER_TOKEN_SECRET ||
      env.ADMIN_API_KEY ||
      "change-me-checkin-token-secret",
    checkinQrPrefix: env.CHECKIN_QR_PREFIX || "nvcyclothon-checkin:",
    maxFilesPerUpload: parseIntWithDefault(env.MAX_FILES_PER_UPLOAD, 10),
    maxUploadSizeBytes: parseIntWithDefault(env.MAX_UPLOAD_SIZE_BYTES, 25 * 1024 * 1024),
    allowedUploadExtensions: parseCsv(env.ALLOWED_UPLOAD_EXTENSIONS, "csv,xlsx,pdf"),
    emailEnabled: parseBool(env.EMAIL_ENABLED, false),
    smtpHost: env.SMTP_HOST || "",
    smtpPort: parseIntWithDefault(env.SMTP_PORT, 587),
    smtpUsername: env.SMTP_USERNAME || "",
    smtpPassword: env.SMTP_PASSWORD || "",
    smtpFromEmail: env.SMTP_FROM_EMAIL || "",
    smtpUseTls: parseBool(env.SMTP_USE_TLS, true),
    razorpayEnabled: parseBool(env.RAZORPAY_ENABLED, false),
    razorpayKeyId: env.RAZORPAY_KEY_ID || "",
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET || "",
    razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET || "",
    communityModeratorEmails: parseCsv(env.COMMUNITY_MODERATOR_EMAILS || "", ""),
  };

  fs.mkdirSync(config.uploadDir, { recursive: true });

  if (config.environment === "production") {
    if (!config.adminAuthEnabled) {
      throw new Error("ADMIN_AUTH_ENABLED must be true in production");
    }
    if (config.adminApiKey === "change-me-before-production" || config.adminApiKey.length < 32) {
      throw new Error("ADMIN_API_KEY must be set to a 32+ character secret in production");
    }
    if (
      config.allowedOrigins.includes("*") ||
      config.allowedOrigins.some((origin) => !origin.startsWith("https://"))
    ) {
      throw new Error("ALLOWED_ORIGINS must contain explicit HTTPS origins in production");
    }
    if (config.volunteerCheckinEnabled) {
      const configuredVolunteerNames = Object.keys(config.volunteerCheckinCredentials);
      if (configuredVolunteerNames.length > 0) {
        for (const name of configuredVolunteerNames) {
          const pin = config.volunteerCheckinCredentials[name];
          if (name.length < 2 || pin.length < 6) {
            throw new Error(
              "VOLUNTEER_CHECKIN_CREDENTIALS entries must use 2+ character names and 6+ character pins"
            );
          }
        }
      } else if (!config.volunteerCheckinPin || config.volunteerCheckinPin.length < 6) {
        throw new Error(
          "VOLUNTEER_CHECKIN_PIN must be at least 6 characters when VOLUNTEER_CHECKIN_ENABLED=true"
        );
      }
      if (
        !config.volunteerTokenSecret ||
        config.volunteerTokenSecret === "change-me-checkin-token-secret" ||
        config.volunteerTokenSecret.length < 16
      ) {
        throw new Error(
          "VOLUNTEER_TOKEN_SECRET must be set to a 16+ character secret when VOLUNTEER_CHECKIN_ENABLED=true"
        );
      }
    }
    if (config.emailEnabled && (!config.smtpHost || !config.smtpFromEmail)) {
      throw new Error("SMTP_HOST and SMTP_FROM_EMAIL are required when EMAIL_ENABLED=true");
    }
    if (
      config.razorpayEnabled &&
      (!config.razorpayKeyId.startsWith("rzp_live_") ||
        !config.razorpayKeySecret ||
        !config.razorpayWebhookSecret)
    ) {
      throw new Error("Live Razorpay credentials and webhook secret are required in production");
    }
  }

  return config;
}

module.exports = {
  loadConfig,
};
