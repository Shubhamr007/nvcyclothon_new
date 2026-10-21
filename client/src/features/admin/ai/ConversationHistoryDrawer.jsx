import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Search,
  Clock,
} from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ConversationHistoryDrawer({
  isOpen,
  onClose,
  conversations,
  activeId = null,
  onSelect,
  onNewChat,
  onDeleteRequest,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const query = searchTerm.toLowerCase();
    return conversations.filter((c) =>
      (c.title || '').toLowerCase().includes(query)
    );
  }, [conversations, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conversation History"
      className="absolute inset-0 z-40 bg-[#faf9f6] flex flex-col border-r border-slate-200 text-left transition-all animate-in fade-in"
    >
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-slate-900">
          <MessageSquare className="w-4 h-4 text-[#0078d4]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Past Chats</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0078d4] bg-[#deecf9] hover:bg-[#c7e0f4] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#deecf9]/40 border-b border-[#c7e0f4] flex items-center gap-1.5 text-[11px] text-[#005a9e]">
        <Clock className="w-3 h-3 text-[#0078d4] shrink-0" />
        <span>Threads safely retained for 4 days from last activity</span>
      </div>

      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {searchTerm ? 'No matching conversations' : 'No past conversations yet.'}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold border border-slate-200/90 shadow-2xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
                onClick={() => {
                  onSelect(conv.id);
                  onClose();
                }}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="truncate text-xs font-normal">
                    {conv.title || 'Operations Thread'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(conv.last_activity_at || conv.updated_at)}
                  </p>
                </div>
                <button
                  type="button"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(conv);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

ConversationHistoryDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  conversations: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
};

