const request = require("supertest");
const { buildApplication } = require("../src/bootstrap");
const { adminEvents } = require("../src/services/adminEvents");
const {
  MemoryRateLimitStore,
  DatabaseRateLimitStore,
  createRateLimitStore,
} = require("../src/services/rateLimitStore");
const { createRateLimiter } = require("../src/middleware/rateLimit");
const {
  KNOWLEDGE_BASE_VERSION,
  getKnowledgeFingerprint,
} = require("../src/services/ragKnowledge");
const {
  initRagTable,
  loadCachedEmbeddings,
  saveCachedEmbeddings,
} = require("../src/db/ragRepository");
const { VectorDatabase } = require("../src/services/vectorStore");

describe("Scale State & Shared Runtime Memory Architecture (Item 3)", () => {
  let runtime;
  let adminToken;

  beforeAll(async () => {
    runtime = await buildApplication({
      env: {
        NODE_ENV: "test",
        ENVIRONMENT: "test",
        DB_BACKEND: "mock",
        ADMIN_AUTH_ENABLED: "true",
        ADMIN_API_KEY: "scale-state-test-key",
        ALLOWED_HOSTS: "127.0.0.1,localhost",
        CASHFREE_ENABLED: "false",
        EMAIL_ENABLED: "false",
      },
      logger: { info() {}, error() {}, log() {} },
    });

    const loginRes = await request(runtime.app)
      .post("/api/admin/session")
      .send({ admin_key: "scale-state-test-key" });
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.close();
    }
  });

  describe("Shared Rate Limiting Store", () => {
    it("MemoryRateLimitStore correctly slides window and resets", async () => {
      const store = new MemoryRateLimitStore();
      const res1 = await store.increment("test", "user-1", 10);
      expect(res1.count).toBe(1);

      const res2 = await store.increment("test", "user-1", 10);
      expect(res2.count).toBe(2);

      store.reset();
      const res3 = await store.increment("test", "user-1", 10);
      expect(res3.count).toBe(1);
    });

    it("DatabaseRateLimitStore shares state across multiple instances via shared repository", async () => {
      const mockRepo = { tables: { rate_limit_hits: [] } };
      const instanceAStore = new DatabaseRateLimitStore(mockRepo);
      const instanceBStore = new DatabaseRateLimitStore(mockRepo);

      await instanceAStore.init();
      await instanceBStore.init();

      // Instance A records a hit
      const hit1 = await instanceAStore.increment("login", "ip-10.0.0.1", 60);
      expect(hit1.count).toBe(1);

      // Instance B receives request from the same IP and checks - should see count 2!
      const hit2 = await instanceBStore.increment("login", "ip-10.0.0.1", 60);
      expect(hit2.count).toBe(2);

      // Total hits stored in shared table
      expect(mockRepo.tables.rate_limit_hits.length).toBe(2);
    });

    it("createRateLimiter factory instantiates shared store when configured", () => {
      const mockRepo = { tables: { rate_limit_hits: [] } };
      const sharedStore = createRateLimitStore({
        repository: mockRepo,
        config: { rateLimitShared: true },
      });
      expect(sharedStore).toBeInstanceOf(DatabaseRateLimitStore);

      const memStore = createRateLimitStore({
        repository: mockRepo,
        config: { rateLimitShared: false },
      });
      expect(memStore).toBeInstanceOf(MemoryRateLimitStore);
    });

    it("rateLimiter middleware enforces shared rate limit asynchronously", async () => {
      const mockRepo = { tables: { rate_limit_hits: [] } };
      const limiter = createRateLimiter({
        repository: mockRepo,
        config: { rateLimitShared: true },
      });

      const scope = "api_call";
      const key = "client-99";

      // Allow 2 requests per 60 seconds
      await limiter.checkAsync({ scope, key, maximum: 2, seconds: 60, message: "Limit hit" });
      await limiter.checkAsync({ scope, key, maximum: 2, seconds: 60, message: "Limit hit" });

      // Third request should throw 429 ApiError
      await expect(
        limiter.checkAsync({ scope, key, maximum: 2, seconds: 60, message: "Limit hit" })
      ).rejects.toMatchObject({
        statusCode: 429,
        code: "RATE_LIMIT_EXCEEDED",
      });
    });
  });

  describe("Shared & Versioned RAG Knowledge Base", () => {
    it("provides stable version string and SHA-256 fingerprint", () => {
      expect(KNOWLEDGE_BASE_VERSION).toBe("2026.2.0");
      const fingerprint = getKnowledgeFingerprint();
      expect(typeof fingerprint).toBe("string");
      expect(fingerprint.length).toBe(16);
    });

    it("loads and saves precomputed embeddings into shared repository cache", async () => {
      const mockRepo = { tables: { rag_knowledge_embeddings: [] } };
      await initRagTable(mockRepo);

      const version = "2026.2.0";
      const fingerprint = getKnowledgeFingerprint();

      // Before saving, cache should be empty
      const before = await loadCachedEmbeddings(mockRepo, version, fingerprint);
      expect(before).toBeNull();

      // Save sample chunk embeddings
      const sampleChunks = [
        {
          id: "chunk_test_1",
          title: "Registration Details",
          category: "rules",
          content: "Details regarding race registration.",
          keywords: ["race", "registration"],
          vector: [0.1, 0.2, 0.3],
          engine: "test-engine",
          model: "test-model",
        },
      ];

      await saveCachedEmbeddings(mockRepo, sampleChunks, version, fingerprint);

      // Now cache should return precomputed embeddings
      const cached = await loadCachedEmbeddings(mockRepo, version, fingerprint);
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe("chunk_test_1");
      expect(cached[0].engine).toBe("test-engine");
    });

    it("VectorDatabase reuses shared cache avoiding cold-start recomputation", async () => {
      const mockRepo = { tables: { rag_knowledge_embeddings: [] } };
      const vectorDb1 = new VectorDatabase();
      const config = { environment: "test", ollamaEnabled: false };

      // First instance initializes and populates shared repository
      await vectorDb1.init(config, mockRepo);
      expect(vectorDb1.initialized).toBe(true);
      expect(mockRepo.tables.rag_knowledge_embeddings.length).toBeGreaterThan(0);

      // Second instance initializes with the same repository — reads from cache!
      const vectorDb2 = new VectorDatabase();
      await vectorDb2.init(config, mockRepo);
      expect(vectorDb2.initialized).toBe(true);
      expect(vectorDb2.isShared).toBe(true);

      const status = vectorDb2.getStatus();
      expect(status.version).toBe(KNOWLEDGE_BASE_VERSION);
      expect(status.sharedStorage).toBe(true);
      expect(status.totalChunks).toBeGreaterThan(0);
    });

    it("VectorDatabase performs semantic search over indexed knowledge chunks", async () => {
      const vectorDb = new VectorDatabase();
      const config = { environment: "test", ollamaEnabled: false };

      const results = await vectorDb.search("What time does registration open?", config, {
        topK: 3,
        threshold: 0.1,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("title");
      expect(results[0]).toHaveProperty("score");
      expect(results[0].score).toBeGreaterThan(0.1);
    });
  });

  describe("Admin RAG Refresh & Status Endpoints", () => {
    it("returns RAG status via GET /api/admin/ai/rag/status", async () => {
      const res = await request(runtime.app)
        .get("/api/admin/ai/rag/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("version", KNOWLEDGE_BASE_VERSION);
      expect(res.body).toHaveProperty("fingerprint");
      expect(res.body).toHaveProperty("totalChunks");
      expect(res.body).toHaveProperty("categories");
    });

    it("triggers RAG refresh and broadcasts real-time SSE event via POST /api/admin/ai/rag/refresh", async () => {
      let ragEventReceived = null;
      const unsubscribe = adminEvents.subscribe((evt) => {
        if (evt.type === "rag") {
          ragEventReceived = evt;
        }
      });

      try {
        const res = await request(runtime.app)
          .post("/api/admin/ai/rag/refresh")
          .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toHaveProperty("version", KNOWLEDGE_BASE_VERSION);

        expect(ragEventReceived).toBeTruthy();
        expect(ragEventReceived.type).toBe("rag");
        expect(ragEventReceived.action).toBe("refreshed");
        expect(ragEventReceived.data.version).toBe(KNOWLEDGE_BASE_VERSION);
      } finally {
        unsubscribe();
      }
    });
  });
});
