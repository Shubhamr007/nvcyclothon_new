const express = require("express");
const { ValidationError, NotFoundError } = require("../errors");

function createJobRouter({ jobQueue }) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const { limit, status, type } = req.query;
      const jobs = await jobQueue.listJobs({
        limit: limit ? Number(limit) : 50,
        status: status ? String(status).trim() : undefined,
        type: type ? String(type).trim() : undefined,
      });
      res.json({ jobs, count: jobs.length });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:jobId", async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const job = await jobQueue.getJob(jobId);
      if (!job) {
        throw new NotFoundError(`Background job '${jobId}' not found`);
      }
      res.json(job);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:jobId/cancel", async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const cancelled = await jobQueue.cancel(jobId);
      if (!cancelled) {
        throw new NotFoundError(`Background job '${jobId}' not found`);
      }
      res.json({
        success: true,
        message: `Job '${jobId}' has been cancelled`,
        job: cancelled,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/enqueue", async (req, res, next) => {
    try {
      const { type, payload } = req.body || {};
      if (!type || typeof type !== "string") {
        throw new ValidationError("Job 'type' is required");
      }
      if (!jobQueue.hasHandler(type)) {
        throw new ValidationError(`Unknown job type '${type}'`);
      }

      const job = await jobQueue.enqueue(type, payload || {});
      res.status(202).json({
        job_id: job.id,
        status: job.status,
        type: job.type,
        message: `Job '${type}' queued successfully`,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createJobRouter,
};
