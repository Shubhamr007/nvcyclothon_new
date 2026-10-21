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
  onEdit = null,
  activeConversationId = null,
  accessToken = null,
}) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0078d4] text-white shadow-xs mt-0.5"
          aria-hidden="true"
        >
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div
        className={`group relative max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed transition-colors shadow-2xs ${
          isUser
            ? 'bg-[#0078d4] text-white border border-[#005a9e] rounded-br-xs'
            : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
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
              ? 'border-t border-white/20 text-blue-100'
              : 'border-t border-slate-100 text-slate-500'
          }`}
        >
          <span>{msg.timestamp || ''}</span>
          <div className="flex items-center gap-2">
            {isUser && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(msg.content, msg.id || `msg_${idx}`)}
                className="inline-flex items-center gap-1 text-blue-100 hover:text-white transition-colors"
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
                  ? 'text-blue-100 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Copy message text"
              aria-label="Copy message text to clipboard"
            >
              {isCopied ? (
                <span className={`flex items-center gap-1 font-semibold ${isUser ? 'text-emerald-200' : 'text-emerald-600'}`}>
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
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#faf9f6] border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs mt-0.5"
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

