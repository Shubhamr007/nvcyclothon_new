import { useState, useRef, useEffect, useCallback } from 'react';
import {
  adminAiCoPilot,
  listAdminAiConversations,
  getAdminAiConversation,
  clearAdminAiConversation,
  deleteAdminAiConversation,
  cancelAdminAiMessage,
} from '../../../api/http';
import { normalizeAiError } from './aiErrorUtils';

export const INITIAL_MESSAGE = {
  id: 'msg_welcome',
  role: 'assistant',
  content: 'Greetings, Race Director! I am your NV Cyclothon Operations & Governance Assistant, grounded in real-time verified database metrics, audited budgets, and sports regulations for Rewa.\n\nHow can I assist you with operations, financial governance, or stakeholder communications today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export function useAiConversation({ accessToken, isOpen }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrompt, setLastPrompt] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);

  const abortControllerRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await listAdminAiConversations(accessToken);
      setConversations(res?.conversations || []);
    } catch {
      // Non-blocking background fetch
    }
  }, [accessToken]);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchConversations();
    }
  }, [isOpen, accessToken, fetchConversations]);

  const selectConversation = useCallback(async (id) => {
    if (!accessToken || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAiConversation(accessToken, id);
      const conv = res?.conversation;
      if (conv) {
        setActiveConversationId(conv.id);
        if (Array.isArray(conv.messages) && conv.messages.length > 0) {
          setMessages(
            conv.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              ragCitations: m.rag_citations || [],
            }))
          );
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      }
    } catch (err) {
      setError(normalizeAiError(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const startNewConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveConversationId(null);
    setMessages([INITIAL_MESSAGE]);
    setError(null);
    setLastPrompt(null);
    setLoading(false);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (activeConversationId && accessToken) {
      cancelAdminAiMessage(accessToken, activeConversationId).catch(() => {});
    }
    setLoading(false);
  }, [activeConversationId, accessToken]);

  const sendMessage = useCallback(async (text, isRetry = false) => {
    const prompt = (text || '').trim();
    if (!prompt || loading || !accessToken) return;

    const userMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = isRetry ? messages : [...messages, userMessage];
    if (!isRetry) {
      setMessages(nextMessages);
    }

    setLoading(true);
    setError(null);
    setLastPrompt(prompt);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const payload = {
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        includeLiveContext: true,
        conversationId: activeConversationId || undefined,
      };

      const res = await adminAiCoPilot(accessToken, payload, {
        signal: controller.signal,
        timeoutMs: 60000,
      });

      if (res?.conversationId && !activeConversationId) {
        setActiveConversationId(res.conversationId);
        fetchConversations();
      }

      if (res?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.messageId || `msg_asst_${Date.now()}`,
            ...res.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ragCitations: res.ragCitations || [],
          },
        ]);
        if (res.metricsSummary) setLiveMetrics(res.metricsSummary);
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(normalizeAiError(err));
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, accessToken, messages, activeConversationId, fetchConversations]);

  const clearCurrentChat = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (activeConversationId && accessToken) {
      try {
        await clearAdminAiConversation(accessToken, activeConversationId);
      } catch {
        // Continue UI reset
      }
    }
    setMessages([INITIAL_MESSAGE]);
    setError(null);
    setLastPrompt(null);
    setLoading(false);
  }, [activeConversationId, accessToken]);

  const removeConversation = useCallback(async (id) => {
    if (!accessToken || !id) return;
    try {
      await deleteAdminAiConversation(accessToken, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeConversationId) {
        startNewConversation();
      }
    } catch (err) {
      setError(normalizeAiError(err));
    }
  }, [accessToken, activeConversationId, startNewConversation]);

  return {
    conversations,
    activeConversationId,
    messages,
    loading,
    error,
    lastPrompt,
    liveMetrics,
    selectConversation,
    startNewConversation,
    stopGeneration,
    sendMessage,
    clearCurrentChat,
    removeConversation,
    fetchConversations,
  };
}
