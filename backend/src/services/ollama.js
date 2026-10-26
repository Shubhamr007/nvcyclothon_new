/**
 * Ollama AI Service for NV Cyclothon Operations Portal.
 * Connects to local Ollama daemon for privacy-preserving, zero-cost intelligence.
 */

const { ApiError } = require("../errors");

async function getOllamaStatus(config) {
  if (!config.ollamaEnabled) {
    return {
      enabled: false,
      available: false,
      currentModel: config.ollamaModel,
      installedModels: [],
      reason: "OLLAMA_ENABLED is false",
    };
  }

  try {
    const res = await fetch(`${config.ollamaUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) {
      return {
        enabled: true,
        available: false,
        currentModel: config.ollamaModel,
        installedModels: [],
        reason: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const installedModels = (data.models || []).map((m) => m.name);
    const modelAvailable = installedModels.some(
      (m) => m === config.ollamaModel || m.startsWith(`${config.ollamaModel}:`)
    );

    return {
      enabled: true,
      available: true,
      currentModel: config.ollamaModel,
      modelReady: modelAvailable,
      installedModels,
    };
  } catch (err) {
    return {
      enabled: true,
      available: false,
      currentModel: config.ollamaModel,
      installedModels: [],
      reason: err.message || "Failed to connect to Ollama",
    };
  }
}

async function callOllamaChat(config, {
  messages,
  temperature = 0.5,
  maxTokens = 1024,
  json = false,
  timeoutMs = 45000,
  signal: userSignal,
}) {
  if (!config.ollamaEnabled) {
    throw new Error("Ollama AI integration is disabled in server configuration.");
  }

  const payload = {
    model: config.ollamaModel,
    messages,
    stream: false,
    options: {
      temperature,
      num_predict: maxTokens,
    },
  };

  if (json) {
    payload.format = "json";
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal =
    userSignal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([timeoutSignal, userSignal])
      : userSignal || timeoutSignal;

  let res;
  try {
    res = await fetch(`${config.ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: combinedSignal,
    });
  } catch (fetchErr) {
    throw new ApiError(
      503,
      `Local Ollama AI service unavailable at ${config.ollamaUrl}. Ensure Ollama is running ('systemctl status ollama'). (${fetchErr.message})`,
      "AI_SERVICE_UNAVAILABLE"
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new ApiError(
      503,
      `Ollama returned status ${res.status}: ${errText.slice(0, 150) || "Model error"}`,
      "AI_MODEL_ERROR"
    );
  }

  const data = await res.json();
  return {
    content: data.message?.content || "",
    totalDurationMs: data.total_duration ? Math.round(data.total_duration / 1e6) : undefined,
    model: data.model || config.ollamaModel,
  };
}

function safeParseJson(rawText, fallback = {}) {
  if (!rawText) return fallback;
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // Try to extract JSON between markdown ```json ... ``` codeblocks or first { ... }
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

async function moderateCommunityPost(config, post) {
  const author = post.name || "Anonymous Participant";
  const bib = post.bib_number ? `BIB #${post.bib_number}` : "No BIB";
  const message = (post.message || "").trim();

  const systemPrompt = `You are a strict, fair content moderation engine for the NV Cyclothon (a family-friendly sporting event in Rewa, India).
Evaluate public community wall posts submitted by riders and fans.
Criteria:
- "approved": Genuine sports passion, congratulations, training updates, event excitement, friendly community banter.
- "rejected": Profanity, hate speech, vulgarity, harassment, political campaigning, off-topic commercial advertisements, spam, phone scams.
- "pending": Ambiguous, multilingual mixed slang requiring human discernment.

You must respond ONLY with a JSON object with this exact shape:
{
  "status": "approved" | "rejected" | "pending",
  "confidence": 0.0 to 1.0,
  "reason": "short explanation for admin operator",
  "tags": ["array", "of", "relevant", "labels"]
}`;

  const userPrompt = `Participant: ${author} (${bib})
Message: "${message}"

Evaluate and output JSON:`;

  const { content } = await callOllamaChat(config, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    maxTokens: 256,
    json: true,
  });

  const parsed = safeParseJson(content, {
    status: "pending",
    confidence: 0.5,
    reason: "Could not automatically classify post.",
    tags: ["unclassified"],
  });

  return {
    status: ["approved", "rejected", "pending"].includes(parsed.status)
      ? parsed.status
      : "pending",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
    reason: parsed.reason || "Processed by local Ollama AI.",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}

async function draftEventEmail(config, { prompt, category = "all", eventSettings = {} }) {
  const eventDate = eventSettings.event_date || "22 November 2026";
  const eventLocation = eventSettings.event_location || "Rewa, Madhya Pradesh";

  const systemPrompt = `You are the Official Communications Lead for NV Cyclothon 2026 ('Ride for Vindhya').
Draft clear, inspiring, professional participant emails.
Guidelines:
- Tone: Energetic, organized, respectful, community-centric.
- Mention NV Cyclothon 2026, Rewa.
- Provide clean formatting with bullet points for logistics (dates, times, venue).

Respond strictly with a JSON object:
{
  "subject": "Concise, compelling subject line",
  "previewText": "Short preview snippet",
  "body": "Formatted email body text with greetings, paragraphs, bullet points, and sign-off."
}`;

  const userPrompt = `Admin Request: ${prompt}
Target Category: ${category}
Event Date: ${eventDate}
Event Venue: ${eventLocation}

Generate email draft JSON:`;

  const { content } = await callOllamaChat(config, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: 768,
    json: true,
  });

  return safeParseJson(content, {
    subject: `NV Cyclothon 2026 Update — ${category !== "all" ? category : "All Riders"}`,
    previewText: "Important update regarding NV Cyclothon 2026",
    body: `Hello Cyclists,\n\n${prompt}\n\nWe look forward to seeing you at the start line!\n\nBest regards,\nNV Cyclothon Organizing Committee\nRewa, M.P.`,
  });
}

async function summarizeAnalytics(config, analytics) {
  const systemPrompt = `You are an executive sports operations analyst for NV Cyclothon 2026.
Synthesize raw registration and revenue data into a concise, high-impact executive brief for race directors.
Focus on:
1. Overall momentum and capacity fill rates
2. Highest & lowest performing ride categories
3. Revenue and on-ground check-in readiness

Respond strictly with a JSON object:
{
  "headline": "1-sentence executive verdict",
  "highlights": ["3 to 4 data-backed bullet points highlighting key insights"],
  "recommendations": ["2 practical, actionable next steps for the committee"]
}`;

  const userPrompt = `Event Data:
Total Registrations: ${analytics.total_registrations || 0}
Approved & Confirmed: ${analytics.approved_registrations || 0}
Checked-In: ${analytics.checked_in_registrations || 0}
Total Revenue (Paise): ${analytics.total_revenue_paise || 0}
Registrations by Category: ${JSON.stringify(analytics.registrations_by_route || {}, null, 2)}
T-Shirt Distribution: ${JSON.stringify(analytics.t_shirt_counts || {}, null, 2)}

Generate brief JSON:`;

  const { content } = await callOllamaChat(config, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 512,
    json: true,
  });

  return safeParseJson(content, {
    headline: "Registration momentum is progressing steadily across core categories.",
    highlights: [
      `${analytics.total_registrations || 0} riders signed up to date.`,
      `${analytics.approved_registrations || 0} riders confirmed with verified payments.`,
      "Category distributions indicate healthy participation in flagship distance rides.",
    ],
    recommendations: [
      "Target community outreach towards categories with remaining open capacity.",
      "Verify volunteer staffing allocations matching route participant counts.",
    ],
  });
}

module.exports = {
  getOllamaStatus,
  callOllamaChat,
  moderateCommunityPost,
  draftEventEmail,
  summarizeAnalytics,
};
