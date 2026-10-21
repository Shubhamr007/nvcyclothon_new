const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const express = require("express");
const { createRateLimiter } = require("./middleware/rateLimit");
const { setupAppSecurity, setupErrorHandler } = require("./middleware/appSecurity");
const { UnauthorizedError } = require("./errors");
const {
  issueAdminToken,
  issueAdminRefreshToken,
  verifyAdminRefreshToken,
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
const { createAdminSyncRouter, wrapRepositoryForSync } = require("./routes/adminSync");
const { createAiRouter } = require("./routes/ai");
const { createContentRouter } = require("./routes/content");
const { createCommunityRouter } = require("./routes/community");
const { createPartnersRouter } = require("./routes/partners");
const { createVendorsRouter } = require("./routes/vendors");
const { createMediaRouter } = require("./routes/media");
const { createStorageService } = require("./services/storage");
const { getJobQueue } = require("./services/jobQueue");
const { registerStandardJobHandlers } = require("./services/jobHandlers");
const { createJobRouter } = require("./routes/jobs");
const { initBackgroundJobsTable, attachJobMethods } = require("./db/jobRepository");

function createApp({ config, repository, emailService, cashfreeService, logger = console }) {
  const app = express();
  const syncedRepository = wrapRepositoryForSync(repository);
  const rateLimiter = createRateLimiter({ repository: syncedRepository, config });
  const storageService = createStorageService(config);

  attachJobMethods(syncedRepository);
  void initBackgroundJobsTable(syncedRepository).catch((err) => {
    logger.error?.("[JobRepository] Initialization error:", err);
  });

  const jobQueue = getJobQueue({ repository: syncedRepository });
  registerStandardJobHandlers(jobQueue, { config, repository: syncedRepository, emailService });

  setupAppSecurity(app, config);

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
        refresh_token: issueAdminRefreshToken(config),
        token_type: "bearer",
        expires_in: config.adminSessionTtlSeconds,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/session/refresh", async (req, res, next) => {
    try {
      const refreshToken = String(req.body?.refresh_token || "").trim();
      verifyAdminRefreshToken(refreshToken, config);
      res.json({
        access_token: issueAdminToken(config),
        refresh_token: issueAdminRefreshToken(config),
        token_type: "bearer",
        expires_in: config.adminSessionTtlSeconds,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/products", createProductsRouter({ config, repository }));
  app.use("/api/orders", createOrdersRouter({ config, repository, rateLimiter }));
  app.use(
    "/api/cyclothon",
    createCyclothonRouter({ config, repository, emailService, cashfreeService, rateLimiter })
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
    createVendorsRouter({ config, repository, emailService, cashfreeService, rateLimiter })
  );

  app.use("/api/checkin", createCheckinRouter({ config, repository, rateLimiter }));

  const mediaModule = createMediaRouter({ config, storageService, rateLimiter });
  app.use("/api/media", mediaModule.deliveryRouter);
  app.use("/api/uploads/image", mediaModule.uploadRouter);

  const uploadsModule = createUploadsRouter({ config, repository });
  app.use("/api/uploads", requireAdmin(config), uploadsModule.router);

  app.use(
    "/api/admin",
    requireAdmin(config),
    createAdminSyncRouter({ repository: syncedRepository })
  );

  app.use(
    "/api/admin/jobs",
    requireAdmin(config),
    createJobRouter({ jobQueue })
  );

  app.use(
    "/api/admin",
    requireAdmin(config),
    createAdminRouter({
      config,
      repository: syncedRepository,
      emailService,
      jobQueue,
    })
  );

  app.use(
    "/api/admin/ai",
    requireAdmin(config),
    createAiRouter({ config, repository: syncedRepository })
  );

  app.use("/api/content", createContentRouter({ repository, config }));
  app.use(
    "/api/community",
    createCommunityRouter({ config, repository, rateLimiter, emailService, logger })
  );

  app.get("/api/gallery", async (_req, res, next) => {
    try {
      res.json(await repository.listPublicGalleryItems());
    } catch (e) {
      next(e);
    }
  });

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({ status: "ok", service: config.appName });
  });

  setupErrorHandler(app, logger);

  return { app, rateLimiter, jobQueue };
}

module.exports = {
  createApp,
};
