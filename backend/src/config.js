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

const PLACEHOLDER_SECRET_PATTERNS = [
  "replace-with",
  "change-me",
  "default-secret",
  "development-",
];

function isPlaceholderSecret(secret) {
  if (!secret) return true;
  const lower = String(secret).toLowerCase().trim();
  return PLACEHOLDER_SECRET_PATTERNS.some((pattern) => lower.includes(pattern));
}

function resolveAssetPath(envPath, candidateRelativePaths) {
  if (envPath) {
    return path.resolve(__dirname, "..", envPath);
  }
  for (const candidate of candidateRelativePaths) {
    const resolved = path.resolve(__dirname, "..", candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return path.resolve(__dirname, "..", candidateRelativePaths[0]);
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
    databaseSsl:
      env.DATABASE_SSL !== undefined
        ? parseBool(env.DATABASE_SSL, false)
        : (environment === "production" &&
           !databaseUrl.includes("127.0.0.1") &&
           !databaseUrl.includes("localhost")),
    databaseSslRejectUnauthorized: parseBool(env.DATABASE_SSL_REJECT_UNAUTHORIZED, true),
    uploadDir: path.resolve(__dirname, "..", env.UPLOAD_DIR || "uploads"),
    allowedOrigins: parseCsv(env.ALLOWED_ORIGINS, "http://localhost:5173"),
    allowedHosts: parseCsv(env.ALLOWED_HOSTS, "localhost,127.0.0.1"),
    adminAuthEnabled: parseBool(env.ADMIN_AUTH_ENABLED, true),
    adminUsername: String(env.ADMIN_USERNAME || "admin").trim(),
    adminBootstrapPassword: String(
      env.ADMIN_BOOTSTRAP_PASSWORD || env.ADMIN_API_KEY || ""
    ),
    adminTokenSecret:
      env.ADMIN_TOKEN_SECRET ||
      (environment === "production" ? "" : env.ADMIN_API_KEY || "development-admin-token-secret"),
    adminSessionTtlSeconds: parseIntWithDefault(env.ADMIN_SESSION_TTL_SECONDS, 900),
    volunteerCheckinEnabled: parseBool(env.VOLUNTEER_CHECKIN_ENABLED, true),
    registrationOpen:
      env.REGISTRATION_OPEN !== undefined
        ? parseBool(env.REGISTRATION_OPEN, true)
        : undefined,
    registrationTentativeDate:
      env.REGISTRATION_TENTATIVE_DATE || "Upcoming Monday at 10:00 AM",
    partnerApplicationsOpen:
      env.PARTNER_APPLICATIONS_OPEN !== undefined
        ? parseBool(env.PARTNER_APPLICATIONS_OPEN, true)
        : undefined,
    vendorApplicationsOpen:
      env.VENDOR_APPLICATIONS_OPEN !== undefined
        ? parseBool(env.VENDOR_APPLICATIONS_OPEN, true)
        : undefined,
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
    // Gmail displays application passwords in groups of four; SMTP expects
    // the 16-character token without formatting spaces.
    smtpPassword: String(env.SMTP_PASSWORD || "").replace(/\s+/g, ""),
    smtpFromEmail: env.SMTP_FROM_EMAIL || "",
    smtpUseTls: parseBool(env.SMTP_USE_TLS, true),
    emailBannerImagePath: resolveAssetPath(env.EMAIL_BANNER_IMAGE_PATH, [
      "assets/email-banner.png",
      "assets/email_banner_image.png",
      "../client/assets/email_banner_image.png",
    ]),
    riderPassTemplatePath: resolveAssetPath(env.RIDER_PASS_TEMPLATE_PATH, [
      "assets/rider-pass-template.png",
      "assets/rider-pass-original.png",
      "../client/assets/NV_Cyclothon_2026_Official_Rider_Pass_Approval.pdf",
    ]),
    certificateTemplatePath: resolveAssetPath(env.CERTIFICATE_TEMPLATE_PATH, [
      "assets/certificate-template.pdf",
      "../client/assets/NV_Cyclothon_2026_Certificate_Design_Approval.pdf",
    ]),
    cashfreeEnabled: parseBool(env.CASHFREE_ENABLED, false),
    cashfreeEnvironment: env.CASHFREE_ENVIRONMENT === "production" ? "production" : "sandbox",
    cashfreeClientId: env.CASHFREE_CLIENT_ID || "",
    cashfreeClientSecret: env.CASHFREE_CLIENT_SECRET || "",
    publicApiUrl: String(env.PUBLIC_API_URL || "https://api.nvcyclothon.com").replace(/\/$/, ""),
    publicSiteUrl: String(env.PUBLIC_SITE_URL || "https://nvcyclothon.com").replace(/\/$/, ""),
    communityModeratorEmails: parseCsv(env.COMMUNITY_MODERATOR_EMAILS || "", ""),
  };

  fs.mkdirSync(config.uploadDir, { recursive: true });

  if (config.environment === "production") {
    if (!config.adminAuthEnabled) {
      throw new Error("ADMIN_AUTH_ENABLED must be true in production");
    }
    if (!env.ADMIN_TOKEN_SECRET || config.adminTokenSecret.length < 32) {
      throw new Error("ADMIN_TOKEN_SECRET must be set to a 32+ character secret in production");
    }
    if (isPlaceholderSecret(config.adminTokenSecret)) {
      throw new Error("ADMIN_TOKEN_SECRET must not use a default placeholder secret in production");
    }
    if (config.adminBootstrapPassword && isPlaceholderSecret(config.adminBootstrapPassword)) {
      throw new Error("ADMIN_BOOTSTRAP_PASSWORD/ADMIN_API_KEY must not use a default placeholder secret in production");
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
          if (name.length < 2 || pin.length < 6 || isPlaceholderSecret(pin)) {
            throw new Error(
              "VOLUNTEER_CHECKIN_CREDENTIALS entries must use 2+ character names and secure 6+ character pins (no placeholders)"
            );
          }
        }
      } else if (!config.volunteerCheckinPin || config.volunteerCheckinPin.length < 6 || isPlaceholderSecret(config.volunteerCheckinPin)) {
        throw new Error(
          "VOLUNTEER_CHECKIN_PIN must be at least 6 characters and not use a default placeholder in production"
        );
      }
      if (
        !config.volunteerTokenSecret ||
        config.volunteerTokenSecret.length < 16 ||
        isPlaceholderSecret(config.volunteerTokenSecret)
      ) {
        throw new Error(
          "VOLUNTEER_TOKEN_SECRET must be set to a secure 16+ character secret (no placeholders) in production"
        );
      }
    }
    if (config.emailEnabled && (!config.smtpHost || !config.smtpFromEmail)) {
      console.warn(
        "[Config Fallback] SMTP_HOST or SMTP_FROM_EMAIL is missing. Gracefully disabling EMAIL_ENABLED so the server stays online."
      );
      config.emailEnabled = false;
    }
    if (
      config.cashfreeEnabled &&
      (!config.cashfreeClientId ||
        !config.cashfreeClientSecret ||
        isPlaceholderSecret(config.cashfreeClientId) ||
        isPlaceholderSecret(config.cashfreeClientSecret))
    ) {
      console.warn(
        "[Config Fallback] Cashfree credentials are missing or placeholder. Gracefully disabling CASHFREE_ENABLED so the server stays online."
      );
      config.cashfreeEnabled = false;
    }
  }

  return config;
}

module.exports = {
  loadConfig,
};
