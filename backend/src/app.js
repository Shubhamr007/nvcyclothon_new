const crypto = require("crypto");
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

function createApp({ config, repository, emailService, razorpayService, logger = console }) {
  const app = express();
  const rateLimiter = createRateLimiter();

  app.disable("x-powered-by");

  app.use((req, _res, next) => {
    const hostHeader = String(req.headers.host || "");
    const host = hostHeader.split(":")[0];
    if (!config.allowedHosts.includes(host)) {
      next(new ApiError(400, "Invalid host header"));
      return;
    }
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new ApiError(403, "Origin is not allowed"));
      },
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Authorization", "Content-Type", "X-Request-ID"],
      maxAge: 600,
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
      req.path === "/api/admin/registrations/certificates";
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
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );
    res.setHeader(
      "Cache-Control",
      req.path.startsWith("/api/admin") ? "no-store" : "no-store, max-age=0"
    );
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

  app.post("/api/admin/session", (req, res, next) => {
    try {
      if (!config.adminAuthEnabled) {
        const isLocalEnvironment =
          config.environment === "development" || config.environment === "test";
        if (!isLocalEnvironment || !isLoopbackRequest(req)) {
          throw new UnauthorizedError("Admin authentication is required");
        }
        res.json({
          access_token: "admin-auth-disabled",
          token_type: "bearer",
          expires_in: 86_400,
        });
        return;
      }

      const key = req.ip || req.connection?.remoteAddress || "unknown";
      rateLimiter.check({
        scope: "admin",
        key,
        maximum: 10,
        seconds: 900,
        message: "Too many admin access attempts. Try again in 15 minutes.",
      });

      const payload = parseSchema(adminLoginSchema, req.body);
      if (!safeCompare(payload.admin_key, config.adminApiKey)) {
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
      razorpayService,
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

  const uploadsModule = createUploadsRouter({
    config,
    repository,
  });
  app.use(
    "/api/uploads",
    config.adminAuthEnabled ? requireAdmin(config) : localBypassGuard(config),
    uploadsModule.router
  );

  app.use(
    "/api/admin",
    config.adminAuthEnabled ? requireAdmin(config) : localBypassGuard(config),
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

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: config.appName });
  });

  app.use((req, _res, next) => {
    next(new ApiError(404, "Not found"));
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && error.type === "entity.parse.failed") {
      res.status(400).json({ detail: "Invalid JSON body" });
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
    res.status(mapped.statusCode).json({ detail: mapped.message });
  });

  return app;
}

module.exports = {
  createApp,
};
