const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");

describe("NV Cyclothon AI Assistant - Conversations, Retention & Cancellation", () => {
  let runtime;
  let adminToken;

  beforeAll(async () => {
    runtime = await buildApplication({
      env: {
        NODE_ENV: "test",
        ENVIRONMENT: "test",
        DB_BACKEND: "mock",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_API_KEY: "test-admin-key-conversations",
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
      .send({ admin_key: "test-admin-key-conversations" })
      .expect(200);

    adminToken = sessionRes.body.access_token;
  });

  afterAll(async () => {
    await runtime.close();
    vi.restoreAllMocks();
  });

  it("creates, retrieves, and lists conversations scoped to admin user", async () => {
    // 1. Create a conversation
    const createRes = await request(runtime.app)
      .post("/api/admin/ai/conversations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Route Safety Protocol" })
      .expect(201);

    expect(createRes.body.conversation).toBeDefined();
    const convId = createRes.body.conversation.id;
    expect(createRes.body.conversation.title).toBe("Route Safety Protocol");

    // 2. Fetch specific conversation
    const getRes = await request(runtime.app)
      .get(`/api/admin/ai/conversations/${convId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(getRes.body.conversation.id).toBe(convId);
    expect(getRes.body.conversation.title).toBe("Route Safety Protocol");
    expect(Array.isArray(getRes.body.conversation.messages)).toBe(true);

    // 3. List conversations
    const listRes = await request(runtime.app)
      .get("/api/admin/ai/conversations")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.conversations)).toBe(true);
    const found = listRes.body.conversations.find((c) => c.id === convId);
    expect(found).toBeDefined();
  });

  it("persists user and assistant messages during copilot generation", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        message: {
          role: "assistant",
          content: "The Rewa route map includes 4 water stations and 2 medical units.",
        },
      }),
    }));

    const copilotRes = await request(runtime.app)
      .post("/api/admin/ai/copilot")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        messages: [{ role: "user", content: "Tell me about water stations on the route." }],
        includeLiveContext: true,
      })
      .expect(200);

    expect(copilotRes.body.conversationId).toBeDefined();
    expect(copilotRes.body.messageId).toBeDefined();

    // Verify messages exist in the conversation
    const convRes = await request(runtime.app)
      .get(`/api/admin/ai/conversations/${copilotRes.body.conversationId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(convRes.body.conversation.messages.length).toBeGreaterThanOrEqual(2);
    expect(convRes.body.conversation.messages.some((m) => m.role === "user")).toBe(true);
    expect(convRes.body.conversation.messages.some((m) => m.role === "assistant")).toBe(true);

    fetchSpy.mockRestore();
  });

  it("clears conversation messages while retaining thread record", async () => {
    const conv = await runtime.repository.createAiConversation({
      title: "Thread to Clear",
      ownerId: "admin",
    });
    await runtime.repository.saveAiMessage({
      conversationId: conv.id,
      role: "user",
      content: "Message to be cleared",
    });

    const clearRes = await request(runtime.app)
      .post(`/api/admin/ai/conversations/${conv.id}/clear`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(clearRes.body.success).toBe(true);

    const getRes = await request(runtime.app)
      .get(`/api/admin/ai/conversations/${conv.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(getRes.body.conversation.messages.length).toBe(0);
  });

  it("deletes a conversation permanently along with messages and feedback", async () => {
    const conv = await runtime.repository.createAiConversation({
      title: "Thread to Delete",
      ownerId: "admin",
    });
    const msg = await runtime.repository.saveAiMessage({
      conversationId: conv.id,
      role: "assistant",
      content: "Message in deleted thread",
    });
    await runtime.repository.recordAiFeedback({
      conversation_id: conv.id,
      message_id: msg.id,
      rating: "positive",
    });

    const deleteRes = await request(runtime.app)
      .delete(`/api/admin/ai/conversations/${conv.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);

    // Verify 404 on subsequent get
    await request(runtime.app)
      .get(`/api/admin/ai/conversations/${conv.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(404);
  });

  it("enforces 4-day retention based on last_activity_at", async () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const staleConv = await runtime.repository.createAiConversation({
      title: "Expired Thread (5 days ago)",
      ownerId: "admin",
    });
    staleConv.last_activity_at = fiveDaysAgo;

    const freshConv = await runtime.repository.createAiConversation({
      title: "Active Thread (2 days ago)",
      ownerId: "admin",
    });
    freshConv.last_activity_at = twoDaysAgo;

    const listRes = await request(runtime.app)
      .get("/api/admin/ai/conversations")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const titles = listRes.body.conversations.map((c) => c.title);
    expect(titles).toContain("Active Thread (2 days ago)");
    expect(titles).not.toContain("Expired Thread (5 days ago)");
  });

  it("cancels generation and records cancelled message status", async () => {
    const conv = await runtime.repository.createAiConversation({
      title: "Thread for Cancellation",
      ownerId: "admin",
    });
    const msg = await runtime.repository.saveAiMessage({
      conversationId: conv.id,
      role: "assistant",
      content: "Partial response...",
      status: "generating",
    });

    const cancelRes = await request(runtime.app)
      .post(`/api/admin/ai/conversations/${conv.id}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ messageId: msg.id })
      .expect(200);

    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.status).toBe("cancelled");

    const getRes = await request(runtime.app)
      .get(`/api/admin/ai/conversations/${conv.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const foundMsg = getRes.body.conversation.messages.find((m) => m.id === msg.id);
    expect(foundMsg.status).toBe("cancelled");
  });

  it("injects exact live participant and volunteer data into coPilot system prompt", async () => {
    // 1. Create a real registration in the repository
    const reg = await runtime.repository.createCyclothonRegistration(
      {
        full_name: "Amit Patel",
        email: "amit.patel@example.com",
        phone: "9876543210",
        age: 28,
        city: "Rewa",
        gender: "male",
        ride_category: "60 Km Road Challenge",
        emergency_contact: "9876543211",
        t_shirt_size: "L",
      },
      { paymentEnabled: false }
    );

    let capturedPrompt = "";
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(async (url, opts) => {
      const body = JSON.parse(opts.body);
      capturedPrompt = body.messages.find((m) => m.role === "system")?.content || "";
      return {
        ok: true,
        json: async () => ({
          message: {
            role: "assistant",
            content: "Found 1 registered rider: Amit Patel in 60 Km Road Challenge.",
          },
        }),
      };
    });

    const res = await request(runtime.app)
      .post("/api/admin/ai/copilot")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        messages: [{ role: "user", content: "Show me the registered participants table" }],
        includeLiveContext: true,
      })
      .expect(200);

    expect(capturedPrompt).toContain("Amit Patel");
    expect(capturedPrompt).toContain("60 Km Road Challenge");
    expect(capturedPrompt).toContain("CRITICAL DATABASE FIDELITY & ZERO-HALLUCINATION DIRECTIVES");
    expect(capturedPrompt).toContain("Official race categories are STRICTLY");
    expect(res.body.message.content).toContain("Amit Patel");

    fetchSpy.mockRestore();
  });
});


