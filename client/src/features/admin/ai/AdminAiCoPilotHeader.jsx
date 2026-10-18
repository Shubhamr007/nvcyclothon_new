import React from 'react';
import PropTypes from 'prop-types';
import { History, Plus, Trash2, RotateCcw } from 'lucide-react';

export function AdminAiCoPilotHeader({
  liveMetrics,
  onOpenHistory,
  onNewChat,
  onClearChat,
  onResetWidth,
  isCustomWidth = false,
}) {
  return (
    <div className="shrink-0 border-b border-[#E5E2DB] dark:border-[#2A2D35] bg-[#F3F1EC] dark:bg-[#18191E] px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span className="font-semibold text-[#252525] dark:text-[#E4E4E4] truncate text-[11px]">
          {liveMetrics
            ? `${liveMetrics.totalRiders} Riders • ₹${Number(liveMetrics.revenueInr).toLocaleString('en-IN')}`
            : 'Verified Event Context'}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isCustomWidth && onResetWidth && (
          <button
            type="button"
            onClick={onResetWidth}
            title="Reset assistant width to default (480px)"
            aria-label="Reset assistant width to default"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[#6B6B6B] dark:text-[#9A9A9A] hover:bg-[#E5E2DB]/50 dark:hover:bg-[#252830] hover:text-[#252525] dark:hover:text-white transition text-[11px]"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Width</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenHistory}
          title="View Past Conversations"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[#6B6B6B] dark:text-[#9A9A9A] hover:bg-[#E5E2DB]/50 dark:hover:bg-[#252830] hover:text-[#252525] dark:hover:text-white transition text-[11px]"
        >
          <History className="h-3.5 w-3.5" />
          <span>History</span>
        </button>
        <button
          type="button"
          onClick={onNewChat}
          title="Start New Thread"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition text-[11px] font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New</span>
        </button>
        <button
          type="button"
          onClick={onClearChat}
          title="Clear Current Chat"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[#6B6B6B] dark:text-[#9A9A9A] hover:bg-red-500/10 hover:text-red-600 transition text-[11px]"
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

AdminAiCoPilotHeader.defaultProps = {
  liveMetrics: null,
  onResetWidth: null,
  isCustomWidth: false,
};
