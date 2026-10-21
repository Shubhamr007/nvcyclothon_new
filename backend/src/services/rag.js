/**
 * RAG (Retrieval-Augmented Generation) Pipeline for NV Cyclothon.
 * Bridges Vector Search with LLM Context Ingestion.
 */

const { globalVectorDb } = require("./vectorStore");

async function retrieveAugmentedContext(
  query,
  config,
  { topK = 3, threshold = 0.22, repository } = {}
) {
  if (!query || typeof query !== "string" || !query.trim()) {
    return { contextText: "", citations: [] };
  }

  const results = await globalVectorDb.search(query.trim(), config, {
    topK,
    threshold,
    repository,
  });

  if (results.length === 0) {
    return { contextText: "", citations: [] };
  }

  const formattedSections = results.map((chunk, idx) => {
    return `[REFERENCE ${idx + 1}: ${chunk.title}]\n${chunk.content}`;
  });

  const contextText = [
    `=== VERIFIED EVENT KNOWLEDGE BASE EXCERPTS ===`,
    formattedSections.join("\n\n"),
    `=== END VERIFIED EVENT KNOWLEDGE BASE ===`,
  ].join("\n\n");

  const citations = results.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    score: c.score,
  }));

  return { contextText, citations };
}

async function searchKnowledgeBase(query, config, options) {
  return globalVectorDb.search(query, config, options);
}

function getRagStatus() {
  return globalVectorDb.getStatus();
}

async function refreshKnowledgeBase(config, repository) {
  return globalVectorDb.refresh(config, repository);
}

async function initKnowledgeBase(config, repository) {
  return globalVectorDb.init(config, repository);
}

module.exports = {
  retrieveAugmentedContext,
  searchKnowledgeBase,
  getRagStatus,
  refreshKnowledgeBase,
  initKnowledgeBase,
};
