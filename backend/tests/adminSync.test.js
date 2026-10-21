const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");
const { adminEvents } = require("../src/services/adminEvents");

describe("Admin Real-Time Sync & Events", () => {
  let runtime;
  let adminToken;

  beforeAll(async () => {
    runtime = await buildApplication({
      env: {
        NODE_ENV: "test",
        ENVIRONMENT: "test",
        DB_BACKEND: "mock",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_API_KEY: "test-admin-key-for-ci",
        ALLOWED_HOSTS: "127.0.0.1,localhost",
        CASHFREE_ENABLED: "false",
        EMAIL_ENABLED: "false",
      },
      logger: { info() {}, error() {}, log() {} },
    });

    const loginRes = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await runtime.close();
  });

  it("requires admin authentication for sync status", async () => {
    const res = await request(runtime.app).get("/api/admin/sync/status");
    expect(res.status).toBe(401);
  });

  it("returns revision and analytics on /api/admin/sync/status with bearer token", async () => {
    const res = await request(runtime.app)
      .get("/api/admin/sync/status")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("revision");
    expect(res.body).toHaveProperty("serverTime");
    expect(res.body).toHaveProperty("lastEvent");
    expect(res.body).toHaveProperty("analytics");
    expect(typeof res.body.revision).toBe("number");
  });

  it("allows query token authentication for SSE stream handshake", async () => {
    const res = await request(runtime.app)
      .get(`/api/admin/sync/status?token=${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("revision");
  });

  it("increments revision and broadcasts events when adminEvents.publish is called", () => {
    const startRevision = adminEvents.getRevision();
    let received = null;
    const unsubscribe = adminEvents.subscribe((evt) => {
      received = evt;
    });

    const published = adminEvents.publish({
      type: "registrations",
      action: "test_action",
      id: 999,
      data: { note: "live test" },
    });

    expect(adminEvents.getRevision()).toBe(startRevision + 1);
    expect(received).toEqual(published);
    expect(published.type).toBe("registrations");
    expect(published.action).toBe("test_action");
    expect(published.id).toBe(999);

    unsubscribe();
  });

  it("automatically publishes events when repository mutations occur via synced proxy", async () => {
    const prevRev = adminEvents.getRevision();

    // Trigger settings update
    const patchRes = await request(runtime.app)
      .patch("/api/admin/settings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ event_location: "Rewa Stadium Ground" });

    expect(patchRes.status).toBe(200);
    expect(adminEvents.getRevision()).toBeGreaterThan(prevRev);
    expect(adminEvents.getLastEvent().type).toBe("settings");
    expect(adminEvents.getLastEvent().action).toBe("updated");
  });
});
