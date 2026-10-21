const { EventEmitter } = require("events");

class AdminEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
    this.revision = 1;
    this.lastEvent = {
      type: "system",
      action: "initialized",
      timestamp: Date.now(),
      revision: this.revision,
    };
  }

  /**
   * Publishes an event to all connected admin SSE clients.
   * @param {Object} event
   * @param {string} event.type - e.g. "registrations", "analytics", "finance", "settings", "volunteers", "partners", "vendors", "delegations"
   * @param {string} event.action - e.g. "created", "paid", "updated", "deleted", "bulk_updated"
   * @param {string|number} [event.id] - Optional ID of the affected entity
   * @param {Object} [event.data] - Optional metadata payload
   */
  publish({ type = "general", action = "updated", id = null, data = null }) {
    this.revision += 1;
    const payload = {
      type,
      action,
      id,
      data,
      timestamp: Date.now(),
      revision: this.revision,
    };
    this.lastEvent = payload;
    this.emit("admin_event", payload);
    return payload;
  }

  /**
   * Subscribes a listener to admin events and returns an unsubscribe function.
   * @param {Function} listener
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    this.on("admin_event", listener);
    return () => {
      this.off("admin_event", listener);
    };
  }

  getRevision() {
    return this.revision;
  }

  getLastEvent() {
    return this.lastEvent;
  }

  getSyncStatus(analyticsSummary = {}) {
    return {
      revision: this.revision,
      serverTime: Date.now(),
      lastEvent: this.lastEvent,
      analytics: {
        total_registrations: analyticsSummary.total_registrations || 0,
        approved_registrations: analyticsSummary.approved_registrations || 0,
        total_revenue_inr: analyticsSummary.total_revenue_inr || 0,
      },
    };
  }
}

// Singleton instance shared across the entire backend process
const adminEvents = new AdminEventBus();

module.exports = {
  adminEvents,
  AdminEventBus,
};
