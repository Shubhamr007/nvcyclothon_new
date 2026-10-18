/**
 * High-Performance In-Memory Vector Database for NV Cyclothon Operations.
 * Supports Ollama dense embeddings (nomic-embed-text) with graceful local semantic fallback.
 */

const { KNOWLEDGE_CHUNKS } = require("./ragKnowledge");

// Calculate Cosine Similarity between two L2-normalized float vectors
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Deterministic semantic fallback vector generator (384 dimensions)
function generateLocalFallbackEmbedding(text, dimensions = 384) {
  const vector = new Array(dimensions).fill(0);
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (words.length === 0) return vector;

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;

    // Character bigrams for morphological similarity
    for (let i = 0; i < word.length - 1; i++) {
      const bgHash = (word.charCodeAt(i) << 8) + word.charCodeAt(i + 1);
      const bgIdx = Math.abs(bgHash) % dimensions;
      vector[bgIdx] += 0.5;
    }
  }

  // L2 Normalize the vector
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) sumSq += vector[i] * vector[i];
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dimensions; i++) vector[i] /= norm;

  return vector;
}

// Generate embedding using Ollama API with graceful local fallback
async function getEmbedding(text, config) {
  const embedModel = config?.ollamaEmbedModel || "nomic-embed-text:latest";
  const url = config?.ollamaUrl || "http://127.0.0.1:11434";

  if (config?.environment === "test" || config?.nodeEnv === "test" || process.env.NODE_ENV === "test") {
    return {
      vector: generateLocalFallbackEmbedding(text),
      engine: "local-semantic",
      model: "sparse-l2-384",
    };
  }

  if (config?.ollamaEnabled) {
    try {
      const res = await fetch(`${url}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: embedModel, prompt: text }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.embedding) && data.embedding.length > 0) {
          return { vector: data.embedding, engine: "ollama", model: embedModel };
        }
      }
    } catch {
      // Fallback seamlessly if model is not pulled or Ollama is offline
    }
  }

  return {
    vector: generateLocalFallbackEmbedding(text),
    engine: "local-semantic",
    model: "sparse-l2-384",
  };
}

class VectorDatabase {
  constructor() {
    this.indexedChunks = [];
    this.initialized = false;
    this.engineUsed = "pending";
  }

  async init(config) {
    if (this.initialized) return;

    this.indexedChunks = [];
    for (const chunk of KNOWLEDGE_CHUNKS) {
      // Include title, keywords, and content for rich vector representations
      const fullText = `${chunk.title}\nKeywords: ${chunk.keywords.join(", ")}\n${chunk.content}`;
      const { vector, engine } = await getEmbedding(fullText, config);
      this.engineUsed = engine;
      this.indexedChunks.push({
        ...chunk,
        vector,
      });
    }

    this.initialized = true;
  }

  async search(queryText, config, { topK = 3, threshold = 0.2 } = {}) {
    if (!this.initialized) {
      await this.init(config);
    }

    const { vector: queryVector } = await getEmbedding(queryText, config);
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    const scored = this.indexedChunks.map((chunk) => {
      const denseScore = cosineSimilarity(queryVector, chunk.vector);

      // Sparse keyword bonus (hybrid retrieval boost)
      let keywordHits = 0;
      for (const token of queryTokens) {
        if (chunk.keywords.some((kw) => kw.includes(token))) keywordHits += 0.08;
        if (chunk.title.toLowerCase().includes(token)) keywordHits += 0.05;
      }

      const compositeScore = Math.min(1.0, denseScore * 0.75 + keywordHits);

      return {
        id: chunk.id,
        title: chunk.title,
        category: chunk.category,
        content: chunk.content,
        score: Math.round(compositeScore * 100) / 100,
      };
    });

    return scored
      .filter((item) => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  getStatus() {
    return {
      initialized: this.initialized,
      totalChunks: this.indexedChunks.length,
      categories: [...new Set(this.indexedChunks.map((c) => c.category))],
      engine: this.engineUsed,
      dimensions: this.indexedChunks[0]?.vector?.length || 384,
    };
  }
}

// Global Singleton Vector Store for the application
const globalVectorDb = new VectorDatabase();

module.exports = {
  cosineSimilarity,
  generateLocalFallbackEmbedding,
  getEmbedding,
  VectorDatabase,
  globalVectorDb,
};
