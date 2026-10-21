const { loadConfig } = require("./config");
const { createRepository } = require("./db");
const { CATALOGUE } = require("./constants");

const { initRagTable } = require("./db/ragRepository");
const { initBackgroundJobsTable } = require("./db/jobRepository");
const { DatabaseRateLimitStore } = require("./services/rateLimitStore");

async function initDb() {
  const config = loadConfig(process.env);
  if (config.dbBackend !== "postgres") {
    throw new Error("db:init requires DB_BACKEND=postgres");
  }

  const repository = createRepository(config);
  try {
    await repository.init();
    await initRagTable(repository);
    await initBackgroundJobsTable(repository);
    const rateStore = new DatabaseRateLimitStore(repository);
    await rateStore.init();

    await repository.seedProducts(CATALOGUE);
    await repository.seedOrganizingMembers();
    await repository.seedSponsorshipTiers();
    await repository.seedGalleryItems();
    await repository.ensureAdminUser(config.adminUsername, config.adminBootstrapPassword);
    console.log("Database schema initialized and seed data applied.");
  } finally {
    await repository.close();
  }
}

initDb().catch((error) => {
  console.error("Failed to initialize database", error);
  process.exit(1);
});
