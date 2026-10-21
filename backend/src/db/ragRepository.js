/**
 * Persistent RAG Knowledge Embeddings Repository.
 * Stores versioned vector embeddings in PostgreSQL so all horizontal
 * Node.js instances share precomputed embeddings without cold-start latency.
 */

async function initRagTable(repository) {
  if (repository?.pool && typeof repository.pool.query === "function") {
    await repository.pool.query(`
      CREATE TABLE IF NOT EXISTS rag_knowledge_embeddings (
        chunk_id VARCHAR(64) PRIMARY KEY,
        version VARCHAR(32) NOT NULL,
        fingerprint VARCHAR(64) NOT NULL,
        title VARCHAR(200) NOT NULL,
        category VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
        vector JSONB NOT NULL,
        engine VARCHAR(32) NOT NULL,
        model VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_rag_knowledge_version_fingerprint
        ON rag_knowledge_embeddings (version, fingerprint);
    `);
  }

  if (repository?.tables && !repository.tables.rag_knowledge_embeddings) {
    repository.tables.rag_knowledge_embeddings = [];
  }
}

async function loadCachedEmbeddings(repository, version, fingerprint) {
  if (repository?.pool && typeof repository.pool.query === "function") {
    try {
      const { rows } = await repository.pool.query(
        `SELECT chunk_id as id, title, category, content, keywords, vector, engine, model
         FROM rag_knowledge_embeddings
         WHERE version = $1 AND fingerprint = $2
         ORDER BY chunk_id ASC`,
        [version, fingerprint]
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          keywords: Array.isArray(r.keywords) ? r.keywords : JSON.parse(r.keywords || "[]"),
          vector: Array.isArray(r.vector) ? r.vector : JSON.parse(r.vector || "[]"),
        }));
      }
      return null;
    } catch (err) {
      console.warn("[RagRepository] Failed to read cached embeddings:", err.message);
      return null;
    }
  }

  if (repository?.tables?.rag_knowledge_embeddings) {
    const matched = repository.tables.rag_knowledge_embeddings.filter(
      (e) => e.version === version && e.fingerprint === fingerprint
    );
    if (matched.length > 0) {
      return matched.map((m) => ({ ...m }));
    }
  }

  return null;
}

async function saveCachedEmbeddings(repository, indexedChunks, version, fingerprint) {
  if (!Array.isArray(indexedChunks) || indexedChunks.length === 0) return;

  if (repository?.pool && typeof repository.pool.query === "function") {
    try {
      for (const chunk of indexedChunks) {
        await repository.pool.query(
          `INSERT INTO rag_knowledge_embeddings
             (chunk_id, version, fingerprint, title, category, content, keywords, vector, engine, model, updated_at)
           VALUES
             ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, NOW())
           ON CONFLICT (chunk_id) DO UPDATE SET
             version = EXCLUDED.version,
             fingerprint = EXCLUDED.fingerprint,
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             content = EXCLUDED.content,
             keywords = EXCLUDED.keywords,
             vector = EXCLUDED.vector,
             engine = EXCLUDED.engine,
             model = EXCLUDED.model,
             updated_at = NOW()`,
          [
            chunk.id,
            version,
            fingerprint,
            chunk.title,
            chunk.category,
            chunk.content,
            JSON.stringify(chunk.keywords || []),
            JSON.stringify(chunk.vector || []),
            chunk.engine || "local-semantic",
            chunk.model || "sparse-l2-384",
          ]
        );
      }
    } catch (err) {
      console.warn("[RagRepository] Failed to save cached embeddings:", err.message);
    }
    return;
  }

  if (repository?.tables) {
    if (!repository.tables.rag_knowledge_embeddings) {
      repository.tables.rag_knowledge_embeddings = [];
    }
    for (const chunk of indexedChunks) {
      const idx = repository.tables.rag_knowledge_embeddings.findIndex(
        (e) => e.chunk_id === chunk.id
      );
      const record = {
        chunk_id: chunk.id,
        id: chunk.id,
        version,
        fingerprint,
        title: chunk.title,
        category: chunk.category,
        content: chunk.content,
        keywords: chunk.keywords,
        vector: chunk.vector,
        engine: chunk.engine,
        model: chunk.model,
      };
      if (idx >= 0) {
        repository.tables.rag_knowledge_embeddings[idx] = record;
      } else {
        repository.tables.rag_knowledge_embeddings.push(record);
      }
    }
  }
}

async function getRagStorageStats(repository) {
  if (repository?.pool && typeof repository.pool.query === "function") {
    try {
      const { rows } = await repository.pool.query(
        "SELECT COUNT(*)::int as count, version, engine FROM rag_knowledge_embeddings GROUP BY version, engine"
      );
      return rows;
    } catch {
      return [];
    }
  }
  return [];
}

module.exports = {
  initRagTable,
  loadCachedEmbeddings,
  saveCachedEmbeddings,
  getRagStorageStats,
};
