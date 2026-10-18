/**
 * AI Conversation Persistence and Lifecycle Management Service.
 * Scopes threads by authenticated user, enforces 4-day retention, and tracks message status.
 */

async function listConversations(repository, ownerId, options = {}) {
  const retentionDays = Number(options.retentionDays) || 4;
  if (repository.listAiConversations) {
    return repository.listAiConversations(ownerId, { retentionDays });
  }
  return [];
}

async function getConversation(repository, id, ownerId) {
  if (repository.getAiConversation) {
    return repository.getAiConversation(id, ownerId);
  }
  return null;
}

async function createConversation(repository, { id, ownerId, title }) {
  if (repository.createAiConversation) {
    return repository.createAiConversation({ id, ownerId, title });
  }
  return {
    id: id || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    owner_id: ownerId,
    title: title || "New Operations Thread",
  };
}

async function clearConversation(repository, id, ownerId) {
  if (repository.clearAiConversation) {
    return repository.clearAiConversation(id, ownerId);
  }
  return true;
}

async function deleteConversation(repository, id, ownerId) {
  if (repository.deleteAiConversation) {
    return repository.deleteAiConversation(id, ownerId);
  }
  return true;
}

async function recordMessage(repository, { id, conversationId, role, content, status, errorMessage, ragCitations }) {
  if (repository.saveAiMessage) {
    return repository.saveAiMessage({ id, conversationId, role, content, status, errorMessage, ragCitations });
  }
  return {
    id: id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversation_id: conversationId,
    role,
    content,
    status,
  };
}

async function updateMessageStatus(repository, messageId, status, errorMessage = null, partialContent = null) {
  if (repository.updateAiMessageStatus) {
    return repository.updateAiMessageStatus(messageId, status, errorMessage, partialContent);
  }
  return null;
}

module.exports = {
  listConversations,
  getConversation,
  createConversation,
  clearConversation,
  deleteConversation,
  recordMessage,
  updateMessageStatus,
};
