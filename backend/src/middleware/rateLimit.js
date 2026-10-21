const { ApiError } = require("../errors");
const { createRateLimitStore, MemoryRateLimitStore } = require("../services/rateLimitStore");

function createRateLimiter(options = {}) {
  const store =
    options.store ||
    createRateLimitStore({
      repository: options.repository,
      config: options.config,
    }) ||
    new MemoryRateLimitStore();

  function check({ scope, key, maximum, seconds, message }) {
    if (typeof store.incrementSync === "function") {
      const { count } = store.incrementSync(scope, key, seconds);
      if (count > maximum) {
        throw new ApiError(429, message, "RATE_LIMIT_EXCEEDED", {
          "Retry-After": String(seconds),
        });
      }
    } else {
      // Async fire-and-forget record if sync increment isn't directly exposed
      void store.increment(scope, key, seconds);
    }
  }

  async function checkAsync({ scope, key, maximum, seconds, message }) {
    const { count } = await store.increment(scope, key, seconds);
    if (count > maximum) {
      throw new ApiError(429, message, "RATE_LIMIT_EXCEEDED", {
        "Retry-After": String(seconds),
      });
    }
  }

  function middleware(scope, maximum, seconds, message) {
    return async (req, _res, next) => {
      try {
        const key = req.ip || req.connection?.remoteAddress || "unknown";
        await checkAsync({ scope, key, maximum, seconds, message });
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  return {
    check,
    checkAsync,
    middleware,
    reset() {
      store.reset();
    },
    getStore() {
      return store;
    },
  };
}

module.exports = {
  createRateLimiter,
};
