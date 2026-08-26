const { loadConfig } = require("./config");
const { CATALOGUE } = require("./constants");
const { createRepository } = require("./db");
const { createApp } = require("./app");
const { createEmailService } = require("./services/email");
const { createRazorpayService } = require("./services/razorpay");

async function buildApplication({ env = process.env, logger = console } = {}) {
  const config = loadConfig(env);
  const repository = createRepository(config);

  await repository.init();
  await repository.seedProducts(CATALOGUE);

  const emailService = createEmailService(config, logger);
  const razorpayService = createRazorpayService(config);
  const app = createApp({
    config,
    repository,
    emailService,
    razorpayService,
    logger,
  });

  return {
    app,
    config,
    repository,
    async close() {
      await repository.close();
    },
  };
}

module.exports = {
  buildApplication,
};
