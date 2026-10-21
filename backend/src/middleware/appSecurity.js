const crypto = require("crypto");
const cors = require("cors");
const helmet = require("helmet");
const express = require("express");
const { ApiError, toApiError } = require("../errors");

function setupAppSecurity(app, config) {
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
        if (!origin) return callback(null, true);
        const isAllowed =
          config.allowedOrigins.includes(origin) ||
          /^https?:\/\/([a-z0-9-]+\.)*nvcyclothon\.(com|in)(:\d+)?$/i.test(origin) ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (isAllowed) return callback(null, true);
        callback(new ApiError(403, "Origin is not allowed"));
      },
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Authorization", "Content-Type", "X-Request-ID", "Accept", "Origin",
        "X-Requested-With", "Cache-Control", "Pragma", "x-client-id",
        "x-api-version", "x-idempotency-key",
      ],
      exposedHeaders: ["X-Request-ID", "Content-Disposition", "Content-Length"],
      optionsSuccessStatus: 200,
      maxAge: 86400,
    })
  );

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  app.use((req, res, next) => {
    const contentLengthRaw = req.header("content-length");
    const contentLength = contentLengthRaw ? Number.parseInt(contentLengthRaw, 10) : 0;
    const isUpload =
      req.path.startsWith("/api/uploads") ||
      req.path === "/upload" ||
      req.path === "/api/admin/registrations/roster-match" ||
      req.path === "/api/admin/registrations/certificates" ||
      req.path.endsWith("/applications");
    if (!isUpload && Number.isInteger(contentLength) && contentLength > 1_048_576) {
      return next(new ApiError(413, "Request body is too large"));
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
      res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
      res.setHeader("Cache-Control", req.path.startsWith("/api/admin") ? "no-store" : "no-store, max-age=0");
    }
    if (config.environment === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  app.use(express.json({ limit: "1mb", verify: (req, _res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  } }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
}

function setupErrorHandler(app, logger = console) {
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
}

module.exports = {
  setupAppSecurity,
  setupErrorHandler,
};
