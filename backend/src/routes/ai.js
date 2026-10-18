const express = require("express");
const {
  getOllamaStatus,
  callOllamaChat,
  moderateCommunityPost,
  draftEventEmail,
  summarizeAnalytics,
} = require("../services/ollama");
const { runAdminCoPilot } = require("../services/coPilot");
const { getRagStatus, searchKnowledgeBase } = require("../services/rag");
const { ValidationError, NotFoundError } = require("../errors");
const {
  aiFeedbackSchema,
  aiConversationCreateSchema,
} = require("../services/validation");
const {
  listConversations,
  getConversation,
  createConversation,
  clearConversation,
  deleteConversation,
  recordMessage,
  updateMessageStatus,
} = require("../services/aiConversationService");

function createAiRouter({ config, repository }) {
  const router = express.Router();
  const getOwnerId = (req) => req.adminSession?.subject || req.user?.id || "admin";

  router.get("/status", async (_req, res) => {
    res.json(await getOllamaStatus(config));
  });

  router.get("/conversations", async (req, res, next) => {
    try {
      const conversations = await listConversations(repository, getOwnerId(req));
      res.json({ conversations });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations", async (req, res, next) => {
    try {
      const parsed = aiConversationCreateSchema.safeParse(req.body || {});
      if (!parsed.success) throw new ValidationError("Invalid conversation title.");
      const conversation = await createConversation(repository, {
        title: parsed.data.title,
        ownerId: getOwnerId(req),
      });
      res.status(201).json({ conversation });
    } catch (err) {
      next(err);
    }
  });

  router.get("/conversations/:id", async (req, res, next) => {
    try {
      const conversation = await getConversation(repository, req.params.id, getOwnerId(req));
      if (!conversation) throw new NotFoundError("Conversation not found.");
      res.json({ conversation });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/conversations/:id", async (req, res, next) => {
    try {
      const success = await deleteConversation(repository, req.params.id, getOwnerId(req));
      if (!success) throw new NotFoundError("Conversation not found.");
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/:id/clear", async (req, res, next) => {
    try {
      const success = await clearConversation(repository, req.params.id, getOwnerId(req));
      if (!success) throw new NotFoundError("Conversation not found.");
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/:id/cancel", async (req, res, next) => {
    try {
      const { messageId } = req.body || {};
      if (messageId) {
        await updateMessageStatus(repository, messageId, "cancelled");
      }
      res.json({ success: true, status: "cancelled", messageId });
    } catch (err) {
      next(err);
    }
  });

  router.post("/copilot", async (req, res, next) => {
    try {
      const { messages, includeLiveContext = true, conversationId } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new ValidationError("Messages array with at least one message is required.");
      }

      const ownerId = getOwnerId(req);
      let activeConversationId = conversationId;
      if (!activeConversationId && repository.createAiConversation) {
        const firstUser = messages.find((m) => m.role === "user")?.content || "New Thread";
        const conv = await createConversation(repository, {
          title: firstUser.slice(0, 45).trim() || "New Operations Thread",
          ownerId,
        });
        activeConversationId = conv.id;
      }

      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      let savedUserMsgId = null;
      if (activeConversationId && lastUserMsg && repository.saveAiMessage) {
        const saved = await recordMessage(repository, {
          conversationId: activeConversationId,
          role: "user",
          content: lastUserMsg.content,
          status: "completed",
        });
        savedUserMsgId = saved.id;
      }

      const abortController = new AbortController();
      req.on("close", () => {
        if (!res.writableEnded) abortController.abort();
      });

      const result = await runAdminCoPilot(config, {
        messages,
        repository,
        includeLiveContext,
        signal: abortController.signal,
      });

      let savedAssistantMsgId = null;
      const assistantContent = result?.message?.content || result?.response;
      if (activeConversationId && assistantContent && repository.saveAiMessage) {
        const saved = await recordMessage(repository, {
          conversationId: activeConversationId,
          role: "assistant",
          content: assistantContent,
          status: "completed",
          ragCitations: result.ragCitations || result.rag_sources || [],
        });
        savedAssistantMsgId = saved.id;
      }

      res.json({
        ...result,
        conversationId: activeConversationId,
        messageId: savedAssistantMsgId,
        userMessageId: savedUserMsgId,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/moderate-post", async (req, res, next) => {
    try {
      const { id, message, name, bib_number } = req.body || {};
      let postData = { message, name, bib_number };
      if (id && !message && repository.listCommunityPosts) {
        const posts = await repository.listCommunityPosts({ status: "all" });
        const found = posts.find((p) => String(p.id) === String(id));
        if (found) postData = { message: found.message, name: found.name, bib_number: found.bib_number };
      }
      if (!postData.message || typeof postData.message !== "string") {
        throw new ValidationError("Message content is required for moderation analysis.");
      }
      res.json(await moderateCommunityPost(config, postData));
    } catch (err) {
      next(err);
    }
  });

  router.post("/draft-email", async (req, res, next) => {
    try {
      const { prompt, category = "all" } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        throw new ValidationError("A prompt describing the email goal is required.");
      }
      let eventSettings = {};
      try {
        if (repository.getSiteSettings) eventSettings = (await repository.getSiteSettings()) || {};
      } catch {}
      res.json(await draftEventEmail(config, { prompt: prompt.trim(), category, eventSettings }));
    } catch (err) {
      next(err);
    }
  });

  router.post("/analytics-summary", async (_req, res, next) => {
    try {
      const [analytics = {}, pvAnalytics = {}] = await Promise.all([
        repository.getAnalytics ? repository.getAnalytics().catch(() => ({})) : {},
        repository.getPartnerVendorAnalytics ? repository.getPartnerVendorAnalytics().catch(() => ({})) : {},
      ]);
      res.json(await summarizeAnalytics(config, { ...analytics, ...pvAnalytics }));
    } catch (err) {
      next(err);
    }
  });

  router.post("/chat", async (req, res, next) => {
    try {
      const { prompt, systemPrompt } = req.body || {};
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        throw new ValidationError("Prompt is required.");
      }
      const messages = [];
      if (systemPrompt && typeof systemPrompt === "string") {
        messages.push({ role: "system", content: systemPrompt.trim() });
      }
      messages.push({ role: "user", content: prompt.trim() });
      res.json(await callOllamaChat(config, { messages, temperature: 0.6, maxTokens: 1024 }));
    } catch (err) {
      next(err);
    }
  });

  router.get("/rag/status", (_req, res) => {
    res.json(getRagStatus());
  });

  router.post("/rag/search", async (req, res, next) => {
    try {
      const { query, topK = 3, threshold = 0.2 } = req.body || {};
      if (!query || typeof query !== "string" || !query.trim()) {
        throw new ValidationError("Query string is required for vector search.");
      }
      const results = await searchKnowledgeBase(query.trim(), config, {
        topK: Number(topK) || 3,
        threshold: Number(threshold) || 0.2,
      });
      res.json({ query: query.trim(), count: results.length, results });
    } catch (err) {
      next(err);
    }
  });

  router.post("/feedback", async (req, res, next) => {
    try {
      const parsed = aiFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Invalid feedback payload: rating must be 'positive' or 'negative'.");
      }
      const result = repository.recordAiFeedback
        ? await repository.recordAiFeedback(parsed.data)
        : { id: `fb_${Date.now()}`, ...parsed.data, created_at: new Date().toISOString() };
      res.json({ success: true, feedback: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createAiRouter,
};
