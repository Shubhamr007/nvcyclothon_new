const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");
const { adminEvents } = require("../src/services/adminEvents");

describe("Durable Background Jobs Architecture", () => {
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

    const sessionRes = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" });
    adminToken = sessionRes.body.access_token;
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.close();
    }
  });

  it("lists background jobs via GET /api/admin/jobs", async () => {
    const res = await request(runtime.app)
      .get("/api/admin/jobs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(typeof res.body.count).toBe("number");
  });

  it("enqueues and processes an event update broadcast email job", async () => {
    const broadcastRes = await request(runtime.app)
      .post("/api/admin/event-updates/email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        subject: "Race Route Advisory",
        message: "Helmets are strictly mandatory at the assembly point.",
      });

    expect(broadcastRes.statusCode).toBe(202);
    expect(broadcastRes.body.job_id).toMatch(/^job_/);
    expect(broadcastRes.body.status).toBe("queued");

    const jobId = broadcastRes.body.job_id;

    let finalJob = null;
    for (let i = 0; i < 25; i++) {
      const checkRes = await request(runtime.app)
        .get(`/api/admin/jobs/${jobId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(checkRes.statusCode).toBe(200);
      if (checkRes.body.status === "completed" || checkRes.body.status === "failed") {
        finalJob = checkRes.body;
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    expect(finalJob).toBeTruthy();
    expect(finalJob.status).toBe("completed");
    expect(finalJob.progress).toBe(100);
    expect(finalJob.type).toBe("event_update_email");
  });

  it("enqueues rider pass generation as a durable background job", async () => {
    const registrationId = 9876;
    runtime.repository.tables.cyclothon_registrations.push({
      id: registrationId,
      full_name: "Rahul Verma",
      email: "rahul.jobtest@example.com",
      phone: "+91 9876501234",
      age: 26,
      city: "Rewa",
      gender: "Male",
      ride_category: "60 Km Road Challenge",
      emergency_contact: "+91 9876501235",
      t_shirt_size: "L",
      status: "approved",
      payment_status: "paid",
      checkin_token: "test_token_123",
      created_at: new Date().toISOString(),
    });

    const queueRes = await request(runtime.app)
      .post("/api/admin/registrations/rider-passes/generate")
      .set("Authorization", `Bearer ${adminToken}`)
      .send([registrationId]);

    expect(queueRes.statusCode).toBe(202);
    expect(queueRes.body.job_id).toMatch(/^job_/);
    expect(queueRes.body.queued).toBe(1);

    const jobId = queueRes.body.job_id;

    let finalJob = null;
    for (let i = 0; i < 35; i++) {
      const checkRes = await request(runtime.app)
        .get(`/api/admin/jobs/${jobId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      if (checkRes.body.status === "completed" || checkRes.body.status === "failed") {
        finalJob = checkRes.body;
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    expect(finalJob).toBeTruthy();
    expect(finalJob.status).toBe("completed");
    expect(finalJob.progress).toBe(100);
    expect(finalJob.result.queued_ids).toContain(registrationId);
  });

  it("broadcasts real-time SSE events during job lifecycle", async () => {
    const emittedEvents = [];
    const unsubscribe = adminEvents.subscribe((event) => {
      if (event.type === "jobs") {
        emittedEvents.push(event);
      }
    });

    try {
      const enqueueRes = await request(runtime.app)
        .post("/api/admin/jobs/enqueue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          type: "event_update_email",
          payload: { subject: "Realtime SSE Test", message: "Hello riders!" },
        });

      expect(enqueueRes.statusCode).toBe(202);
      const jobId = enqueueRes.body.job_id;

      for (let i = 0; i < 25; i++) {
        const checkRes = await request(runtime.app)
          .get(`/api/admin/jobs/${jobId}`)
          .set("Authorization", `Bearer ${adminToken}`);
        if (checkRes.body.status === "completed") break;
        await new Promise((r) => setTimeout(r, 60));
      }

      const actions = emittedEvents.map((e) => e.action);
      expect(actions).toContain("queued");
      expect(actions).toContain("completed");
    } finally {
      unsubscribe();
    }
  });

  it("supports cancelling a job via POST /api/admin/jobs/:jobId/cancel", async () => {
    const job = await runtime.repository.createBackgroundJob({
      type: "event_update_email",
      payload: { subject: "Cancel Test" },
      status: "queued",
    });

    const cancelRes = await request(runtime.app)
      .post(`/api/admin/jobs/${job.id}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    const checkRes = await request(runtime.app)
      .get(`/api/admin/jobs/${job.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(checkRes.body.status).toBe("cancelled");
  });

  it("returns 400 when attempting to enqueue an unknown job type", async () => {
    const res = await request(runtime.app)
      .post("/api/admin/jobs/enqueue")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ type: "unknown_nonexistent_task", payload: {} });

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("VALIDATION_FAILED");
  });
});
