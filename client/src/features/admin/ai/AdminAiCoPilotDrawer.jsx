import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw, Bot, ArrowDown, Pencil } from 'lucide-react';
import { AdminSlideOver } from '../components/AdminSlideOver';
import { useAppSelector } from '../../../store/hooks';
import { AiAccuracyDisclaimer } from './AiAccuracyDisclaimer';
import { TypingIndicator } from './TypingIndicator';
import { AiSuggestionsPanel } from './AiSuggestionsPanel';
import { UnifiedComposerButton } from './UnifiedComposerButton';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';
import { ClearChatConfirmModal } from './ClearChatConfirmModal';
import { AiAssistantErrorBoundary } from './AiAssistantErrorBoundary';
import { ChatMessageItem } from './ChatMessageItem';
import { AdminAiCoPilotHeader } from './AdminAiCoPilotHeader';
import { ComposerContextPills } from './ComposerContextPills';
import { useAiConversation } from './useAiConversation';

export const AdminAiCoPilotDrawer = memo(function AdminAiCoPilotDrawer({
  isOpen,
  onClose,
  initialPrompt = '',
  customWidth = null,
  onResetWidth = null,
  isCustomWidth = false,
}) {
  const accessToken = useAppSelector((state) => state.auth?.accessToken);
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, mode: 'clear', targetConv: null });
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const {
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
  } = useAiConversation({ accessToken, isOpen });

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
      setTimeout(() => textareaRef.current?.focus(), 150);
      if (initialPrompt) setInput(initialPrompt);
    }
  }, [isOpen, initialPrompt, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, loading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  }, []);

  const handleSendPrompt = (text) => {
    const promptToSend = (text || input).trim();
    if (!promptToSend) return;
    sendMessage(promptToSend);
    setInput('');
    setEditingMessageId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    } else if (e.key === 'Escape' && loading) {
      e.preventDefault();
      stopGeneration();
    }
  };

  const handleInsertSuggestion = useCallback((promptText) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n${promptText}` : promptText));
    setTimeout(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.value.length;
    }, 50);
  }, []);

  const handleAddContext = useCallback((snippet) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} (${snippet})` : snippet));
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleEditPrompt = useCallback((content, msgId) => {
    setInput(content);
    setEditingMessageId(msgId);
    setTimeout(() => {
      textareaRef.current?.focus();
      if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.value.length;
    }, 50);
  }, []);

  const handleCopy = (content, index) => {
    navigator.clipboard?.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleConfirmAction = () => {
    if (confirmModal.mode === 'delete' && confirmModal.targetConv) {
      removeConversation(confirmModal.targetConv.id);
    } else {
      clearCurrentChat();
    }
    setConfirmModal({ isOpen: false, mode: 'clear', targetConv: null });
  };

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={onClose}
      title="Operations Assistant"
      subtitle="Verified Real-Time Event Intelligence"
      icon={Bot}
      width="sm:w-[28rem] xl:w-[32rem]"
      customWidth={customWidth}
      docked
      bodyClassName="flex-1 flex flex-col min-h-0 overflow-hidden p-0"
    >
      <AiAssistantErrorBoundary onReset={() => selectConversation(activeConversationId)} onStartNew={startNewConversation}>
        <div className="relative flex h-full w-full flex-col bg-[#FAF9F6] text-slate-900 overflow-hidden">
          <AdminAiCoPilotHeader
            liveMetrics={liveMetrics}
            onOpenHistory={() => setHistoryOpen(true)}
            onNewChat={startNewConversation}
            onClearChat={() => setConfirmModal({ isOpen: true, mode: 'clear', targetConv: null })}
            onResetWidth={onResetWidth}
            isCustomWidth={isCustomWidth}
          />

          {/* MESSAGES SCROLL AREA */}
          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#FAF9F6]">
            {messages.map((msg, idx) => (
              <ChatMessageItem
                key={msg.id || idx}
                msg={msg}
                idx={idx}
                isCopied={copiedIndex === idx}
                onCopy={handleCopy}
                onEdit={handleEditPrompt}
                activeConversationId={activeConversationId}
                accessToken={accessToken}
              />
            ))}

            {loading && <TypingIndicator label="Thinking…" onCancel={stopGeneration} />}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <p className="font-bold">Generation Unsuccessful</p>
                  <p className="text-[11px] text-rose-700">{error}</p>
                  {lastPrompt && (
                    <button
                      type="button"
                      onClick={() => sendMessage(lastPrompt, true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-100 hover:bg-rose-200 px-2.5 py-1 text-[11px] font-bold text-rose-900 transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Request</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              aria-label="Scroll to latest message"
              className="absolute right-6 bottom-32 z-30 p-2 rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-50 transition-all border border-slate-200"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          {/* COLLAPSIBLE SUGGESTIONS SECTION */}
          <AiSuggestionsPanel onInsertPrompt={handleInsertSuggestion} disabled={loading} />

          {/* PINNED INPUT COMPOSER & CONTEXT PILLS */}
          <div className="shrink-0 sticky bottom-0 z-10 border-t border-slate-200 bg-[#F4F6F8] p-3 space-y-2">
            {editingMessageId && (
              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-md">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <Pencil className="w-3 h-3 shrink-0" />
                  Editing prompt (modify and send to resubmit)
                </span>
                <button
                  type="button"
                  onClick={() => { setEditingMessageId(null); setInput(''); }}
                  className="text-[10px] font-semibold underline hover:text-amber-950 shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

            <ComposerContextPills onAddContext={handleAddContext} />

            <form onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }} className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask about verified registrations, audit budgets, volunteer roles… (Enter to send)"
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0078d4] focus:outline-none focus:ring-1 focus:ring-[#0078d4] transition"
                />
              </div>
              <UnifiedComposerButton
                isGenerating={loading}
                disabled={!input.trim()}
                onSend={() => handleSendPrompt()}
                onStop={stopGeneration}
              />
            </form>

            <AiAccuracyDisclaimer compact />
          </div>

          <ConversationHistoryDrawer
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={selectConversation}
            onNewChat={startNewConversation}
            onDeleteRequest={(conv) => setConfirmModal({ isOpen: true, mode: 'delete', targetConv: conv })}
          />

          <ClearChatConfirmModal
            isOpen={confirmModal.isOpen}
            mode={confirmModal.mode}
            title={confirmModal.targetConv?.title}
            onConfirm={handleConfirmAction}
            onCancel={() => setConfirmModal({ isOpen: false, mode: 'clear', targetConv: null })}
          />
        </div>
      </AiAssistantErrorBoundary>
    </AdminSlideOver>
  );
});

AdminAiCoPilotDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialPrompt: PropTypes.string,
  customWidth: PropTypes.number,
  onResetWidth: PropTypes.func,
  isCustomWidth: PropTypes.bool,
};

export default AdminAiCoPilotDrawer;

