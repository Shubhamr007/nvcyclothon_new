const crypto = require("crypto");

/**
 * Durable Background Jobs Database Repository.
 * Supports both PostgreSQL pool and in-memory mock repository for tests.
 */

async function initBackgroundJobsTable(repository) {
  if (repository.pool && typeof repository.pool.query === "function") {
    await repository.pool.query(`
      CREATE TABLE IF NOT EXISTS background_jobs (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'queued',
        progress INTEGER NOT NULL DEFAULT 0,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        result JSONB DEFAULT NULL,
        error_message TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ DEFAULT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_background_jobs_status
        ON background_jobs (status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_background_jobs_type
        ON background_jobs (type, created_at DESC);
    `);
  }

  if (repository.tables && !repository.tables.background_jobs) {
    repository.tables.background_jobs = [];
  }
}

async function createBackgroundJob(repository, { id, type, payload = {}, status = "queued" }) {
  const jobId = id || `job_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  if (repository.pool && typeof repository.pool.query === "function") {
    const { rows } = await repository.pool.query(
      `INSERT INTO background_jobs (id, type, status, progress, payload, created_at, updated_at)
       VALUES ($1, $2, $3, 0, $4::jsonb, NOW(), NOW())
       RETURNING *`,
      [jobId, type, status, JSON.stringify(payload)]
    );
    return rows[0];
  }

  if (!repository.tables.background_jobs) {
    repository.tables.background_jobs = [];
  }

  const job = {
    id: jobId,
    type,
    status,
    progress: 0,
    payload: { ...payload },
    result: null,
    error_message: null,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };
  repository.tables.background_jobs.unshift(job);
  return { ...job };
}

async function getBackgroundJob(repository, id) {
  if (!id) return null;

  if (repository.pool && typeof repository.pool.query === "function") {
    const { rows } = await repository.pool.query(
      "SELECT * FROM background_jobs WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }

  if (!repository.tables?.background_jobs) return null;
  const found = repository.tables.background_jobs.find((j) => j.id === id);
  return found ? { ...found } : null;
}

async function updateBackgroundJob(repository, id, { status, progress, result, errorMessage }) {
  if (!id) return null;
  const now = new Date().toISOString();
  const isTerminal = ["completed", "failed", "cancelled"].includes(status);

  if (repository.pool && typeof repository.pool.query === "function") {
    const fields = ["updated_at = NOW()"];
    const values = [id];
    let idx = 2;

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (progress !== undefined) {
      fields.push(`progress = $${idx++}`);
      values.push(Math.max(0, Math.min(100, Math.round(progress))));
    }
    if (result !== undefined) {
      fields.push(`result = $${idx++}::jsonb`);
      values.push(result === null ? null : JSON.stringify(result));
    }
    if (errorMessage !== undefined) {
      fields.push(`error_message = $${idx++}`);
      values.push(errorMessage);
    }
    if (isTerminal) {
      fields.push("completed_at = NOW()");
    }

    const { rows } = await repository.pool.query(
      `UPDATE background_jobs SET ${fields.join(", ")} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  if (!repository.tables?.background_jobs) return null;
  const idx = repository.tables.background_jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  const job = repository.tables.background_jobs[idx];
  if (status !== undefined) job.status = status;
  if (progress !== undefined) {
    job.progress = Math.max(0, Math.min(100, Math.round(progress)));
  }
  if (result !== undefined) job.result = result;
  if (errorMessage !== undefined) job.error_message = errorMessage;
  job.updated_at = now;
  if (isTerminal && !job.completed_at) job.completed_at = now;

  repository.tables.background_jobs[idx] = { ...job };
  return { ...job };
}

async function listBackgroundJobs(repository, { limit = 50, type, status } = {}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));

  if (repository.pool && typeof repository.pool.query === "function") {
    const where = [];
    const values = [];
    let idx = 1;

    if (type) {
      where.push(`type = $${idx++}`);
      values.push(type);
    }
    if (status) {
      where.push(`status = $${idx++}`);
      values.push(status);
    }

    values.push(safeLimit);
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await repository.pool.query(
      `SELECT * FROM background_jobs ${whereClause} ORDER BY created_at DESC LIMIT $${idx}`,
      values
    );
    return rows;
  }

  if (!repository.tables?.background_jobs) return [];
  let list = [...repository.tables.background_jobs];
  if (type) list = list.filter((j) => j.type === type);
  if (status) list = list.filter((j) => j.status === status);

  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list.slice(0, safeLimit).map((j) => ({ ...j }));
}

async function cancelBackgroundJob(repository, id) {
  const job = await getBackgroundJob(repository, id);
  if (!job) return null;
  if (["completed", "failed", "cancelled"].includes(job.status)) {
    return job;
  }
  return updateBackgroundJob(repository, id, {
    status: "cancelled",
    errorMessage: "Cancelled by administrator",
  });
}

function attachJobMethods(repository) {
  repository.initBackgroundJobsTable = () => initBackgroundJobsTable(repository);
  repository.createBackgroundJob = (data) => createBackgroundJob(repository, data);
  repository.getBackgroundJob = (id) => getBackgroundJob(repository, id);
  repository.updateBackgroundJob = (id, data) => updateBackgroundJob(repository, id, data);
  repository.listBackgroundJobs = (opts) => listBackgroundJobs(repository, opts);
  repository.cancelBackgroundJob = (id) => cancelBackgroundJob(repository, id);
  return repository;
}

module.exports = {
  initBackgroundJobsTable,
  createBackgroundJob,
  getBackgroundJob,
  updateBackgroundJob,
  listBackgroundJobs,
  cancelBackgroundJob,
  attachJobMethods,
};
