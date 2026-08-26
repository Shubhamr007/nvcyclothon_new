const { ApiError } = require("../errors");

function createRateLimiter() {
  const attempts = new Map();

  function check({ scope, key, maximum, seconds, message }) {
    const now = Date.now();
    const cutoff = now - seconds * 1000;
    const mapKey = `${scope}:${key}`;
    const window = attempts.get(mapKey) || [];
    const active = window.filter((entry) => entry > cutoff);

    if (active.length >= maximum) {
      throw new ApiError(429, message, { "Retry-After": String(seconds) });
    }

    active.push(now);
    attempts.set(mapKey, active);
  }

  function middleware(scope, maximum, seconds, message) {
    return (req, _res, next) => {
      try {
        const key = req.ip || req.connection?.remoteAddress || "unknown";
        check({ scope, key, maximum, seconds, message });
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  return {
    check,
    middleware,
  };
}

module.exports = {
  createRateLimiter,
};
