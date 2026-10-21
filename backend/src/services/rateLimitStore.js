/**
 * Shared Rate Limiting Storage Engine for Multi-Instance Deployments.
 * Supports MemoryStore (single instance / test fast-path) and
 * DatabaseRateLimitStore (PostgreSQL shared table for horizontal scale).
 */

class MemoryRateLimitStore {
  constructor() {
    this.attempts = new Map();
  }

  async increment(scope, key, windowSeconds) {
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000;
    const mapKey = `${scope}:${key}`;
    const window = this.attempts.get(mapKey) || [];
    const active = window.filter((entry) => entry > cutoff);

    active.push(now);
    this.attempts.set(mapKey, active);

    return {
      count: active.length,
      ttlRemaining: windowSeconds,
    };
  }

  incrementSync(scope, key, windowSeconds) {
    const now = Date.now();
    const cutoff = now - windowSeconds * 1000;
    const mapKey = `${scope}:${key}`;
    const window = this.attempts.get(mapKey) || [];
    const active = window.filter((entry) => entry > cutoff);

    active.push(now);
    this.attempts.set(mapKey, active);

    return {
      count: active.length,
      ttlRemaining: windowSeconds,
    };
  }

  reset() {
    this.attempts.clear();
  }
}

class DatabaseRateLimitStore {
  constructor(repository) {
    this.repository = repository;
    this.memoryFallback = new MemoryRateLimitStore();
    this.initialized = false;
    this.lastCleanup = Date.now();
  }

  async init() {
    if (this.initialized) return;
    if (this.repository?.pool && typeof this.repository.pool.query === "function") {
      await this.repository.pool.query(`
        CREATE TABLE IF NOT EXISTS rate_limit_hits (
          id BIGSERIAL PRIMARY KEY,
          scope VARCHAR(64) NOT NULL,
          key VARCHAR(128) NOT NULL,
          hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_lookup
          ON rate_limit_hits (scope, key, hit_at DESC);
      `);
    }

    if (this.repository?.tables && !this.repository.tables.rate_limit_hits) {
      this.repository.tables.rate_limit_hits = [];
    }
    this.initialized = true;
  }

  async increment(scope, key, windowSeconds) {
    if (!this.initialized) await this.init();

    if (this.repository?.pool && typeof this.repository.pool.query === "function") {
      try {
        const client = this.repository.pool;
        await client.query(
          "INSERT INTO rate_limit_hits (scope, key, hit_at) VALUES ($1, $2, NOW())",
          [scope, key]
        );

        const { rows } = await client.query(
          `SELECT COUNT(*)::int AS count FROM rate_limit_hits
           WHERE scope = $1 AND key = $2
           AND hit_at >= NOW() - ($3 || ' seconds')::interval`,
          [scope, key, windowSeconds]
        );

        // Lazy cleanup every 5 minutes
        if (Date.now() - this.lastCleanup > 300000) {
          this.lastCleanup = Date.now();
          void client.query(
            "DELETE FROM rate_limit_hits WHERE hit_at < NOW() - INTERVAL '2 hours'"
          ).catch(() => {});
        }

        return {
          count: rows[0]?.count || 1,
          ttlRemaining: windowSeconds,
        };
      } catch (err) {
        console.warn("[RateLimitStore] DB check failed, using fallback:", err.message);
        return this.memoryFallback.increment(scope, key, windowSeconds);
      }
    }

    if (this.repository?.tables) {
      if (!this.repository.tables.rate_limit_hits) {
        this.repository.tables.rate_limit_hits = [];
      }
      const now = new Date();
      const cutoff = new Date(Date.now() - windowSeconds * 1000);
      this.repository.tables.rate_limit_hits.push({ scope, key, hit_at: now });

      const count = this.repository.tables.rate_limit_hits.filter(
        (h) => h.scope === scope && h.key === key && h.hit_at >= cutoff
      ).length;

      return { count, ttlRemaining: windowSeconds };
    }

    return this.memoryFallback.increment(scope, key, windowSeconds);
  }

  incrementSync(scope, key, windowSeconds) {
    void this.increment(scope, key, windowSeconds).catch(() => {});
    return this.memoryFallback.incrementSync(scope, key, windowSeconds);
  }

  reset() {
    this.memoryFallback.reset();
    if (this.repository?.tables) {
      this.repository.tables.rate_limit_hits = [];
    }
    if (this.repository?.pool && typeof this.repository.pool.query === "function") {
      void this.repository.pool.query("TRUNCATE TABLE rate_limit_hits").catch(() => {});
    }
  }
}

function createRateLimitStore({ repository, config } = {}) {
  const useShared =
    config?.rateLimitStore === "database" ||
    config?.rateLimitShared === true ||
    (config?.environment === "production" && repository?.pool);

  if (useShared && repository) {
    return new DatabaseRateLimitStore(repository);
  }
  return new MemoryRateLimitStore();
}

module.exports = {
  MemoryRateLimitStore,
  DatabaseRateLimitStore,
  createRateLimitStore,
};
