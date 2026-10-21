const { adminEvents } = require("./adminEvents");
const {
  createBackgroundJob,
  getBackgroundJob,
  updateBackgroundJob,
  listBackgroundJobs,
  cancelBackgroundJob,
} = require("../db/jobRepository");

class DurableJobQueue {
  constructor({ repository, concurrency = 2 } = {}) {
    this.repository = repository;
    this.concurrency = Math.max(1, concurrency);
    this.handlers = new Map();
    this.activeControllers = new Map();
    this.activeCount = 0;
    this.isProcessing = false;
  }

  registerHandler(type, handlerFn) {
    if (typeof handlerFn !== "function") {
      throw new Error(`Handler for job type '${type}' must be a function`);
    }
    this.handlers.set(type, handlerFn);
    return this;
  }

  hasHandler(type) {
    return this.handlers.has(type);
  }

  async enqueue(type, payload = {}) {
    if (!this.handlers.has(type)) {
      throw new Error(`No handler registered for job type: ${type}`);
    }

    const job = await createBackgroundJob(this.repository, {
      type,
      payload,
      status: "queued",
    });

    adminEvents.publish({
      type: "jobs",
      action: "queued",
      id: job.id,
      data: {
        id: job.id,
        type: job.type,
        status: "queued",
        progress: 0,
        created_at: job.created_at,
      },
    });

    setImmediate(() => this.processNext());
    return job;
  }

  async processNext() {
    if (this.activeCount >= this.concurrency) return;

    try {
      const queuedJobs = await listBackgroundJobs(this.repository, {
        status: "queued",
        limit: 1,
      });

      if (!queuedJobs || queuedJobs.length === 0) return;
      const job = queuedJobs[0];

      // Mark as processing
      const startedJob = await updateBackgroundJob(this.repository, job.id, {
        status: "processing",
        progress: job.progress || 0,
      });

      this.activeCount++;
      const controller = new AbortController();
      this.activeControllers.set(job.id, controller);

      adminEvents.publish({
        type: "jobs",
        action: "started",
        id: job.id,
        data: {
          id: job.id,
          type: job.type,
          status: "processing",
          progress: startedJob.progress || 0,
        },
      });

      const handler = this.handlers.get(job.type);

      const updateProgress = async (progressPercent, meta = {}) => {
        const pct = Math.max(0, Math.min(100, Math.round(progressPercent)));
        await updateBackgroundJob(this.repository, job.id, {
          progress: pct,
        });

        adminEvents.publish({
          type: "jobs",
          action: "progress",
          id: job.id,
          data: {
            id: job.id,
            type: job.type,
            status: "processing",
            progress: pct,
            ...meta,
          },
        });
      };

      (async () => {
        try {
          const result = await handler(startedJob, {
            updateProgress,
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            await updateBackgroundJob(this.repository, job.id, {
              status: "cancelled",
              errorMessage: "Job was cancelled during execution",
            });
            adminEvents.publish({
              type: "jobs",
              action: "cancelled",
              id: job.id,
              data: { id: job.id, type: job.type, status: "cancelled" },
            });
          } else {
            const completed = await updateBackgroundJob(this.repository, job.id, {
              status: "completed",
              progress: 100,
              result: result || {},
            });
            adminEvents.publish({
              type: "jobs",
              action: "completed",
              id: job.id,
              data: {
                id: job.id,
                type: job.type,
                status: "completed",
                progress: 100,
                result: completed.result,
              },
            });
          }
        } catch (err) {
          const isCancelled = controller.signal.aborted;
          const status = isCancelled ? "cancelled" : "failed";
          await updateBackgroundJob(this.repository, job.id, {
            status,
            errorMessage: err.message || "Job processing failed",
          });
          adminEvents.publish({
            type: "jobs",
            action: status,
            id: job.id,
            data: {
              id: job.id,
              type: job.type,
              status,
              error: err.message,
            },
          });
        } finally {
          this.activeControllers.delete(job.id);
          this.activeCount--;
          setImmediate(() => this.processNext());
        }
      })();

      // If concurrency headroom remains, check for more queued jobs immediately
      if (this.activeCount < this.concurrency) {
        setImmediate(() => this.processNext());
      }
    } catch (error) {
      console.error("[JobQueue] Unexpected error in worker loop:", error);
    }
  }

  async cancel(jobId) {
    const controller = this.activeControllers.get(jobId);
    if (controller) {
      controller.abort();
    }

    const cancelled = await cancelBackgroundJob(this.repository, jobId);
    if (cancelled) {
      adminEvents.publish({
        type: "jobs",
        action: "cancelled",
        id: jobId,
        data: { id: jobId, type: cancelled.type, status: "cancelled" },
      });
    }
    return cancelled;
  }

  async getJob(jobId) {
    return getBackgroundJob(this.repository, jobId);
  }

  async listJobs(opts) {
    return listBackgroundJobs(this.repository, opts);
  }
}

let defaultQueue = null;

function getJobQueue({ repository, concurrency = 2 } = {}) {
  if (!defaultQueue || (repository && defaultQueue.repository !== repository)) {
    defaultQueue = new DurableJobQueue({ repository, concurrency });
  }
  return defaultQueue;
}

module.exports = {
  DurableJobQueue,
  getJobQueue,
};
