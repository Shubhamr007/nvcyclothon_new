/**
 * AI Assistant Error Mapping and Normalization Utilities.
 * Maps raw API errors, network issues, and model failures into actionable user messages.
 */

export function normalizeAiError(error) {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('cancelled')) {
    return 'Generation was stopped.';
  }

  const message = error.message || String(error);
  const status = error.status || error.statusCode;

  if (status === 401 || status === 403) {
    return 'Admin session expired or unauthorized. Please refresh and log in again.';
  }

  if (status === 404) {
    return 'Conversation not found or has expired past the 4-day retention window.';
  }

  if (status === 429) {
    return 'AI request limit reached. Please wait a few seconds before trying again.';
  }

  if (status === 503 || message.includes('Ollama') || message.includes('model')) {
    return 'Local AI model service is unavailable. Please verify the Ollama daemon is running.';
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('timeout')) {
    return 'Network connection timed out or unreachable. Please verify server status.';
  }

  return message.length > 150 ? `${message.slice(0, 150)}...` : message;
}

export function isRetryableError(error) {
  if (!error) return false;
  if (error.name === 'AbortError' || error.message?.includes('aborted')) return false;
  const status = error.status || error.statusCode;
  if (status === 401 || status === 403 || status === 404) return false;
  return true;
}
