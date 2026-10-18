import React from 'react';
import PropTypes from 'prop-types';
import { Sparkles, User, Copy, Check, Pencil } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import { RagCitationsBadge } from './RagCitationsBadge';
import { AiResponseFeedback } from './AiResponseFeedback';

export function ChatMessageItem({
  msg,
  idx,
  isCopied,
  onCopy,
  onEdit,
  activeConversationId,
  accessToken,
}) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs mt-0.5"
          aria-hidden="true"
        >
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div
        className={`group relative max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-colors shadow-2xs ${
          isUser
            ? 'bg-[#2B2D31] text-white dark:bg-[#252830] border border-[#3E424B]/50 dark:border-[#323640] rounded-br-xs'
            : 'bg-white dark:bg-[#1C1E24] text-[#252525] dark:text-[#E4E4E4] border border-[#E5E2DB] dark:border-[#2C2F38] rounded-bl-xs'
        }`}
      >
        <div className="font-sans">
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          ) : (
            <MarkdownContent text={msg.content} />
          )}
        </div>

        {!isUser && <RagCitationsBadge citations={msg.ragCitations} />}

        {/* Action and timestamp footer */}
        <div
          className={`mt-2.5 pt-1.5 flex items-center justify-between gap-2 text-[10px] ${
            isUser
              ? 'border-t border-white/10 text-zinc-400'
              : 'border-t border-[#EFECE6] dark:border-[#2A2D35] text-[#6B6B6B] dark:text-[#9A9A9A]'
          }`}
        >
          <span>{msg.timestamp || ''}</span>
          <div className="flex items-center gap-2">
            {isUser && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(msg.content, msg.id || `msg_${idx}`)}
                className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                title="Edit and revise this prompt"
                aria-label="Edit this message in composer"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onCopy(msg.content, idx)}
              className={`inline-flex items-center gap-1 transition-colors ${
                isUser
                  ? 'text-zinc-300 hover:text-white'
                  : 'text-[#6B6B6B] dark:text-[#9A9A9A] hover:text-[#252525] dark:hover:text-white'
              }`}
              title="Copy message text"
              aria-label="Copy message text to clipboard"
            >
              {isCopied ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Check className="h-3 w-3" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Copy
                </span>
              )}
            </button>
          </div>
        </div>

        {!isUser && (
          <AiResponseFeedback
            messageId={msg.id || `msg_${idx}`}
            conversationId={activeConversationId}
            accessToken={accessToken}
          />
        )}
      </div>

      {isUser && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E5E2DB] dark:bg-[#2A2D35] text-[#252525] dark:text-[#D4D4D4] font-semibold text-xs shadow-2xs mt-0.5"
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

ChatMessageItem.propTypes = {
  msg: PropTypes.shape({
    id: PropTypes.string,
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    ragCitations: PropTypes.array,
  }).isRequired,
  idx: PropTypes.number.isRequired,
  isCopied: PropTypes.bool.isRequired,
  onCopy: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  activeConversationId: PropTypes.string,
  accessToken: PropTypes.string,
};

ChatMessageItem.defaultProps = {
  onEdit: null,
  activeConversationId: null,
  accessToken: null,
};
