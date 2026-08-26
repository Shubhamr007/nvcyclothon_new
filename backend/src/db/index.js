const { MockRepository } = require("./mockRepository");
const { PostgresRepository } = require("./postgresRepository");

function createRepository(config) {
  if (config.dbBackend === "mock") {
    return new MockRepository();
  }
  return new PostgresRepository(config);
}

module.exports = {
  createRepository,
};
