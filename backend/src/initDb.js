const { loadConfig } = require("./config");
const { createRepository } = require("./db");
const { CATALOGUE } = require("./constants");

async function initDb() {
  const config = loadConfig(process.env);
  if (config.dbBackend !== "postgres") {
    throw new Error("db:init requires DB_BACKEND=postgres");
  }

  const repository = createRepository(config);
  try {
    await repository.init();
    await repository.seedProducts(CATALOGUE);
    console.log("Database schema initialized and seed data applied.");
  } finally {
    await repository.close();
  }
}

initDb().catch((error) => {
  console.error("Failed to initialize database", error);
  process.exit(1);
});
