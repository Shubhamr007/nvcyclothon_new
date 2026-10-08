const { buildApplication } = require("./bootstrap");

// Process-level guards: Prevent background exceptions or unhandled rejections
// from terminating the Node process and causing a 502 Bad Gateway outage.
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Process Guard] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Process Guard] Uncaught Exception:", error);
});

async function start() {
  const runtime = await buildApplication();
  const server = runtime.app.listen(runtime.config.port, () => {
    console.log(`NV Cyclothon API listening on port ${runtime.config.port}`);
    console.log(
      `DB backend: ${runtime.config.dbBackend} | Environment: ${runtime.config.environment}`
    );
  });

  // Clean up expired unpaid pending registrations every 15 minutes
  const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
  const cleanupTimer = setInterval(async () => {
    try {
      const cleaned = await runtime.repository.cleanupExpiredPendingRegistrations(30);
      if (cleaned.length > 0) {
        console.log(`Cleaned up ${cleaned.length} expired pending registration(s)`);
      }
    } catch (err) {
      console.error("Pending registration cleanup failed", err);
    }
  }, CLEANUP_INTERVAL_MS);

  async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down...`);
    clearInterval(cleanupTimer);
    server.close(async () => {
      await runtime.close();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
