const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");

describe("NV Cyclothon Admin AI Integration (Ollama)", () => {
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
        OLLAMA_ENABLED: "true",
        OLLAMA_URL: "http://127.0.0.1:11434",
        OLLAMA_MODEL: "llama3.2:latest",
      },
      logger: {
        info() {},
        error() {},
        log() {},
      },
    });

    const sessionRes = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "test-admin-key-for-ci" })
      .expect(200);

    adminToken = sessionRes.body.access_token;
  });

  afterAll(async () => {
    await runtime.close();
    vi.restoreAllMocks();
  });

  it("requires admin bearer token to access AI endpoints", async () => {
    await request(runtime.app)
      .get("/api/admin/ai/status")
      .expect(401);

    await request(runtime.app)
      .post("/api/admin/ai/moderate-post")
      .send({ message: "Hello world" })
      .expect(401);
  });

  it("checks Ollama status and reports availability", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async (url) => {
      if (url.includes("/api/tags")) {
        return {
          ok: true,
          json: async () => ({
            models: [
              { name: "llama3.2:latest" },
              { name: "qwen2.5-coder:1.5b" },
            ],
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const res = await request(runtime.app)
      .get("/api/admin/ai/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.enabled).toBe(true);
    expect(res.body.available).toBe(true);
    expect(res.body.currentModel).toBe("llama3.2:latest");
    expect(res.body.modelReady).toBe(true);
    expect(res.body.installedModels).toContain("llama3.2:latest");

    fetchSpy.mockRestore();
  });

  it("moderates community post content and returns structured decision", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async (url) => {
      if (url.includes("/api/chat")) {
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                status: "approved",
                confidence: 0.95,
                reason: "Inspiring sports community post.",
                tags: ["cycling", "motivation"],
              }),
            },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const res = await request(runtime.app)
      .post("/api/admin/ai/moderate-post")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Rahul Verma",
        bib_number: "204",
        message: "Can't wait to complete the 60km challenge! Training in Rewa has been great.",
      })
      .expect(200);

    expect(res.body.status).toBe("approved");
    expect(res.body.confidence).toBeGreaterThanOrEqual(0.9);
    expect(res.body.reason).toContain("Inspiring");
    expect(res.body.tags).toContain("cycling");

    fetchSpy.mockRestore();
  });

  it("drafts event announcement email based on admin prompt", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async (url) => {
      if (url.includes("/api/chat")) {
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                subject: "NV Cyclothon 2026: Bib Collection Schedule Announced",
                previewText: "Collect your official race bibs at Rewa Stadium",
                body: "Dear Cyclists,\n\nBib collection starts Friday at 10 AM.\n\nBest,\nOrganizing Committee",
              }),
            },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const res = await request(runtime.app)
      .post("/api/admin/ai/draft-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        prompt: "Tell 60km riders to collect bibs at Rewa Stadium",
        category: "60 Km Road Challenge",
      })
      .expect(200);

    expect(res.body.subject).toContain("Bib Collection");
    expect(res.body.body).toContain("Dear Cyclists");

    fetchSpy.mockRestore();
  });

  it("generates an executive analytics summary for race directors", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async (url) => {
      if (url.includes("/api/chat")) {
        return {
          ok: true,
          json: async () => ({
            message: {
              content: JSON.stringify({
                headline: "Strong early demand with 60 Km category nearing capacity.",
                highlights: [
                  "Registration fill rate is at 74%.",
                  "Verified revenue pace exceeds prior edition by 18%.",
                ],
                recommendations: [
                  "Boost promotions for Kid-o-thon category.",
                  "Lock in volunteer route marshal assignments.",
                ],
              }),
            },
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const res = await request(runtime.app)
      .post("/api/admin/ai/analytics-summary")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.headline).toBeTruthy();
    expect(Array.isArray(res.body.highlights)).toBe(true);
    expect(res.body.highlights.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.recommendations)).toBe(true);

    fetchSpy.mockRestore();
  });

  it("interacts with Admin Operations Co-Pilot with multi-turn context", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (url.includes("/api/chat")) {
        return {
          ok: true,
          json: async () => ({
            message: {
              role: "assistant",
              content: "You have 120 confirmed riders in 100km Gran Fondo, and gross revenue is ₹1,45,000.",
            },
            model: "llama3.2:latest",
            total_duration: 500000000,
          }),
        };
      }
      return { ok: false, status: 404 };
    });

    const res = await request(runtime.app)
      .post("/api/admin/ai/copilot")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        messages: [
          { role: "user", content: "What is our current 100km participation and revenue status?" },
        ],
        includeLiveContext: true,
      })
      .expect(200);

    expect(res.body.message).toBeTruthy();
    expect(res.body.message.role).toBe("assistant");
    expect(res.body.message.content).toContain("120 confirmed riders");
    expect(res.body.metricsSummary).toBeDefined();

    fetchSpy.mockRestore();
  });

  it("retrieves vector knowledge chunks via RAG semantic search", async () => {
    // 1. Status check
    const statusRes = await request(runtime.app)
      .get("/api/admin/ai/rag/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(statusRes.body.dimensions).toBeDefined();

    // 2. Vector search for helmet safety rules
    const searchRes = await request(runtime.app)
      .post("/api/admin/ai/rag/search")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ query: "Are helmets compulsory for the 100km ride?" })
      .expect(200);

    expect(searchRes.body.count).toBeGreaterThan(0);
    expect(searchRes.body.results[0].title).toContain("Helmet");
    expect(searchRes.body.results[0].score).toBeGreaterThan(0.2);

    // 3. Vector search for ambulance emergency contacts
    const emergencyRes = await request(runtime.app)
      .post("/api/admin/ai/rag/search")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ query: "emergency hospital phone number for ambulance" })
      .expect(200);

    expect(emergencyRes.body.count).toBeGreaterThan(0);
    expect(emergencyRes.body.results[0].content).toContain("Sanjay Gandhi");
  });

  it("records AI response feedback and handles revisions and validation", async () => {
    // 1. Submit positive feedback
    const posRes = await request(runtime.app)
      .post("/api/admin/ai/feedback")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        rating: "positive",
        message_id: "msg_12345",
        conversation_id: "conv_67890",
      })
      .expect(200);

    expect(posRes.body.success).toBe(true);
    expect(posRes.body.feedback.rating).toBe("positive");
    expect(posRes.body.feedback.message_id).toBe("msg_12345");

    // 2. Revise to negative feedback with reason and comments
    const negRes = await request(runtime.app)
      .post("/api/admin/ai/feedback")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        rating: "negative",
        reason: "Incorrect or factually inaccurate",
        comments: "The registration fee was cited as ₹500 instead of ₹850.",
        message_id: "msg_12345",
        conversation_id: "conv_67890",
      })
      .expect(200);

    expect(negRes.body.success).toBe(true);
    expect(negRes.body.feedback.rating).toBe("negative");
    expect(negRes.body.feedback.reason).toBe("Incorrect or factually inaccurate");
    expect(negRes.body.feedback.comments).toContain("₹850");

    // 3. Reject invalid rating
    await request(runtime.app)
      .post("/api/admin/ai/feedback")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        rating: "neutral",
        message_id: "msg_12345",
      })
      .expect(400);
  });
});
