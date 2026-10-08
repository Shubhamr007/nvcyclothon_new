const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createRateLimiter } = require("./middleware/rateLimit");
const {
  ApiError,
  UnauthorizedError,
  ValidationError,
  toApiError,
} = require("./errors");
const {
  safeCompare,
  issueAdminToken,
  requireAdmin,
} = require("./services/security");
const {
  parseSchema,
  adminLoginSchema,
} = require("./services/validation");
const { createProductsRouter } = require("./routes/products");
const { createOrdersRouter } = require("./routes/orders");
const { createCyclothonRouter } = require("./routes/cyclothon");
const { createCheckinRouter } = require("./routes/checkin");
const { createUploadsRouter } = require("./routes/uploads");
const { createAdminRouter } = require("./routes/admin");
const { createContentRouter } = require("./routes/content");
const { createCommunityRouter } = require("./routes/community");
const { createPartnersRouter } = require("./routes/partners");
const { createVendorsRouter } = require("./routes/vendors");
const { createMediaRouter } = require("./routes/media");
const { createStorageService } = require("./services/storage");
const { resolveProfileImage } = require("./services/profileMedia");

const LOOPBACK_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function isLoopbackRequest(req) {
  const ip = String(req.ip || req.connection?.remoteAddress || "").trim();
  if (LOOPBACK_IPS.has(ip)) {
    return true;
  }

  const hostHeader = String(req.headers.host || "");
  const host = hostHeader.split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

function localBypassGuard(config) {
  return (req, _res, next) => {
    const isLocalEnvironment =
      config.environment === "development" || config.environment === "test";
    if (!isLocalEnvironment || !isLoopbackRequest(req)) {
      next(new UnauthorizedError("Admin authentication is required"));
      return;
    }
    next();
  };
}

function createApp({ config, repository, emailService, cashfreeService, logger = console }) {
  const app = express();
  const rateLimiter = createRateLimiter();
  const storageService = createStorageService(config);

  app.disable("x-powered-by");

  app.use((req, _res, next) => {
    const hostHeader = String(req.headers.host || "");
    const host = hostHeader.split(":")[0].toLowerCase();
    const isAllowedHost =
      !host ||
      config.allowedHosts.includes(host) ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "nvcyclothon.com" ||
      host.endsWith(".nvcyclothon.com") ||
      host === "nvcyclothon.in" ||
      host.endsWith(".nvcyclothon.in");
    if (!isAllowedHost) {
      next(new ApiError(400, "Invalid host header"));
      return;
    }
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const isAllowed =
          config.allowedOrigins.includes(origin) ||
          /^https?:\/\/([a-z0-9-]+\.)*nvcyclothon\.(com|in)(:\d+)?$/i.test(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (isAllowed) {
          callback(null, true);
          return;
        }
        callback(new ApiError(403, "Origin is not allowed"));
      },
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "X-Request-ID",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
        "x-client-id",
        "x-api-version",
        "x-idempotency-key",
      ],
      exposedHeaders: ["X-Request-ID", "Content-Disposition", "Content-Length"],
      optionsSuccessStatus: 200,
      maxAge: 86400,
    })
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use((req, res, next) => {
    const contentLengthRaw = req.header("content-length");
    const contentLength = contentLengthRaw ? Number.parseInt(contentLengthRaw, 10) : 0;
    const isUpload =
      req.path.startsWith("/api/uploads") ||
      req.path === "/upload" ||
      req.path === "/api/admin/registrations/roster-match" ||
      req.path === "/api/admin/registrations/certificates" ||
      req.path === "/api/partners/applications" ||
      req.path === "/api/partnerships/applications" ||
      req.path === "/api/vendors/applications";
    if (!isUpload && Number.isInteger(contentLength) && contentLength > 1_048_576) {
      next(new ApiError(413, "Request body is too large"));
      return;
    }

    const requestId = req.header("x-request-id") || crypto.randomUUID();
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    const isMedia = req.path.startsWith("/api/media") || req.path.includes("/media/");
    if (!isMedia) {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
      );
      res.setHeader(
        "Cache-Control",
        req.path.startsWith("/api/admin") ? "no-store" : "no-store, max-age=0"
      );
    }
    if (config.environment === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
    next();
  });

  app.use(express.json({ limit: "1mb", verify: (req, _res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  } }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.post("/api/admin/session", async (req, res, next) => {
    try {
      const key = req.ip || req.connection?.remoteAddress || "unknown";
      rateLimiter.check({
        scope: "admin",
        key,
        maximum: 10,
        seconds: 900,
        message: "Too many admin access attempts. Try again in 15 minutes.",
      });

      const payload = parseSchema(adminLoginSchema, req.body);
      const adminUser = await repository.getAdminUser(config.adminUsername);
      const passwordMatches = adminUser?.active
        ? await bcrypt.compare(payload.admin_key, adminUser.password_hash)
        : false;
      if (!passwordMatches) {
        throw new UnauthorizedError("Invalid administrator credentials");
      }

      res.json({
        access_token: issueAdminToken(config),
        token_type: "bearer",
        expires_in: config.adminSessionTtlSeconds,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(
    "/api/products",
    createProductsRouter({
      config,
      repository,
    })
  );

  app.use(
    "/api/orders",
    createOrdersRouter({
      config,
      repository,
      rateLimiter,
    })
  );

  app.use(
    "/api/cyclothon",
    createCyclothonRouter({
      config,
      repository,
      emailService,
      cashfreeService,
      rateLimiter,
    })
  );

  const partnersRouter = createPartnersRouter({
    config,
    repository,
    emailService,
    cashfreeService,
    rateLimiter,
  });
  app.use("/api/partners", partnersRouter);
  app.use("/api/partnerships", partnersRouter);

  app.use(
    "/api/vendors",
    createVendorsRouter({
      config,
      repository,
      emailService,
      cashfreeService,
      rateLimiter,
    })
  );

  app.use(
    "/api/checkin",
    createCheckinRouter({
      config,
      repository,
      rateLimiter,
    })
  );

  const mediaModule = createMediaRouter({
    config,
    storageService,
    rateLimiter,
  });
  app.use("/api/media", mediaModule.deliveryRouter);
  app.use("/api/uploads/image", mediaModule.uploadRouter);

  const uploadsModule = createUploadsRouter({
    config,
    repository,
  });
  app.use(
    "/api/uploads",
    requireAdmin(config),
    uploadsModule.router
  );

  app.use(
    "/api/admin",
    requireAdmin(config),
    createAdminRouter({
      config,
      repository,
      emailService,
    })
  );

  app.use(
    "/api/content",
    createContentRouter({
      repository,
      config,
    })
  );

  app.use(
    "/api/community",
    createCommunityRouter({
      config,
      repository,
      rateLimiter,
      emailService,
      logger,
    })
  );

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({ status: "ok", service: config.appName });
  });

  app.use((req, _res, next) => {
    next(new ApiError(404, "Not found"));
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && error.type === "entity.parse.failed") {
      res.status(400).json({ detail: "Invalid JSON body", code: "INVALID_JSON" });
      return;
    }

    const mapped = toApiError(error);
    if (mapped.headers) {
      for (const [key, value] of Object.entries(mapped.headers)) {
        res.setHeader(key, value);
      }
    }

    if (mapped.statusCode >= 500) {
      logger.error(error);
    }

    const defaultCodes = {
      400: "VALIDATION_FAILED",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      413: "PAYLOAD_TOO_LARGE",
      415: "UNSUPPORTED_MEDIA_TYPE",
      429: "RATE_LIMIT_EXCEEDED",
      500: "INTERNAL_SERVER_ERROR",
      503: "SERVICE_UNAVAILABLE",
    };
    const code = mapped.code || defaultCodes[mapped.statusCode] || "UNKNOWN_ERROR";

    res.status(mapped.statusCode).json({
      detail: mapped.message,
      code,
    });
  });

  return { app, rateLimiter };
}

module.exports = {
  createApp,
};
