import React from 'react';
import PropTypes from 'prop-types';
import { History, Plus, Trash2, RotateCcw } from 'lucide-react';

export function AdminAiCoPilotHeader({
  liveMetrics = null,
  onOpenHistory,
  onNewChat,
  onClearChat,
  onResetWidth = null,
  isCustomWidth = false,
}) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-[#F4F6F8] px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span className="font-semibold text-slate-800 truncate text-[11px]">
          {liveMetrics
            ? `${liveMetrics.totalRiders} Riders • ₹${Number(liveMetrics.revenueInr).toLocaleString('en-IN')}`
            : 'Verified Event Context'}
        </span>
        <span
          className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-medium bg-white text-slate-600 rounded border border-slate-200 shrink-0"
          title="RAG Knowledge Base & Shared Semantic Vectors v2026.2.0"
        >
          KB v2026.2
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isCustomWidth && onResetWidth && (
          <button
            type="button"
            onClick={onResetWidth}
            title="Reset assistant width to default (480px)"
            aria-label="Reset assistant width to default"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition text-[11px]"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Width</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenHistory}
          title="View Past Conversations"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 transition text-[11px]"
        >
          <History className="h-3.5 w-3.5" />
          <span>History</span>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          title="Start New Thread"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[#0078d4] hover:bg-[#deecf9] transition text-[11px] font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New</span>
        </button>
        <button
          type="button"
          onClick={onClearChat}
          title="Clear Current Chat"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition text-[11px]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
}

AdminAiCoPilotHeader.propTypes = {
  liveMetrics: PropTypes.object,
  onOpenHistory: PropTypes.func.isRequired,
  onNewChat: PropTypes.func.isRequired,
  onClearChat: PropTypes.func.isRequired,
  onResetWidth: PropTypes.func,
  isCustomWidth: PropTypes.bool,
};

