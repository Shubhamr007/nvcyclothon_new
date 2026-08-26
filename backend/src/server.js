const { buildApplication } = require("./bootstrap");

async function start() {
  const runtime = await buildApplication();
  const server = runtime.app.listen(runtime.config.port, () => {
    console.log(`NV Cyclothon API listening on port ${runtime.config.port}`);
    console.log(
      `DB backend: ${runtime.config.dbBackend} | Environment: ${runtime.config.environment}`
    );
  });

  async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down...`);
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
