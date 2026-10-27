const express = require("express");
const { adminEvents } = require("../services/adminEvents");

function wrapRepositoryForSync(repository) {
  if (!repository || typeof repository !== "object") return repository;

  return new Proxy(repository, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig !== "function") return orig;

      return async function (...args) {
        const result = await orig.apply(target, args);

        try {
          if (prop === "bulkUpdateRegistrationStatus" || prop === "updateRegistrationStatus" || prop === "updateGuardianConsent") {
            adminEvents.publish({ type: "registrations", action: "updated" });
            adminEvents.publish({ type: "analytics", action: "updated" });
          } else if (prop === "bulkAssignCyclothonBatch") {
            adminEvents.publish({ type: "registrations", action: "batch_updated" });
          } else if (prop === "updateEventBudget") {
            adminEvents.publish({ type: "finance", action: "budget_updated" });
          } else if (prop === "updateSiteSettings") {
            adminEvents.publish({ type: "settings", action: "updated" });
          } else if (prop === "deleteAdminRecords") {
            const entity = args[0];
            adminEvents.publish({ type: entity || "records", action: "deleted" });
            adminEvents.publish({ type: "analytics", action: "updated" });
          } else if (prop === "createVolunteerAccount" || prop === "updateVolunteerAccount") {
            adminEvents.publish({ type: "volunteers", action: "updated" });
          } else if (prop === "moderateCommunityPost" || prop === "deleteCommunityPost") {
            adminEvents.publish({ type: "community", action: "updated" });
          }
        } catch (error) {
          console.error("[Sync Proxy Error]", error?.message);
        }

        return result;
      };
    },
  });
}

function createAdminSyncRouter({ repository }) {
  const router = express.Router();

  // SSE Stream for Real-Time Invalidations & Multi-Screen Broadcasts
  router.get("/events/stream", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Initial connection handshake
    const initialPayload = {
      type: "connection",
      action: "connected",
      revision: adminEvents.getRevision(),
      timestamp: Date.now(),
    };
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    const unsubscribe = adminEvents.subscribe((event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (_) {}
    });

    const pingInterval = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch (_) {}
    }, 25000);

    req.on("close", () => {
      clearInterval(pingInterval);
      unsubscribe();
      res.end();
    });
  });

  // Bounded Polling Endpoint: Lightweight (~200B) Status & Revision Check
  router.get("/sync/status", async (_req, res, next) => {
    try {
      const analytics = typeof repository.getAnalytics === "function"
        ? await repository.getAnalytics()
        : {};
      res.json(adminEvents.getSyncStatus(analytics));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createAdminSyncRouter,
  wrapRepositoryForSync,
};
