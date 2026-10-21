import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const CURATED_SUGGESTIONS = [
  {
    id: 'riders-table',
    category: 'Riders',
    title: 'Registered riders list',
    desc: 'Table of participants, categories & on-ground check-ins',
    prompt: 'Show me the registered participants in a tabular format with ID, Name, Category, Payment Status, and Check-In state.',
  },
  {
    id: 'financial-summary',
    category: 'Finance',
    title: 'Operating finance summary',
    desc: 'Gross inflows, approved expenses & net surplus',
    prompt: 'Provide a breakdown of total gross inflows, approved operating disbursements, and current net operating position.',
  },
  {
    id: 'volunteers-duty',
    category: 'Volunteers',
    title: 'Volunteer duty roster',
    desc: 'Marshal positions & check-in desk credentials',
    prompt: 'What is our volunteer duty roster and active check-in desk account status?',
  },
  {
    id: 'announcement-draft',
    category: 'Comms',
    title: 'Draft rider email update',
    desc: 'Bib collection schedule at SAF Ground',
    prompt: 'Draft an event announcement email to registered cyclists about race bib collection at SAF Ground Rewa.',
  },
];

const STORAGE_KEY = 'nv_ai_copilot_suggestions_open';

export const AiSuggestionsPanel = memo(function AiSuggestionsPanel({
  onInsertPrompt,
  disabled = false,
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Fallback for private mode
      }
      return next;
    });
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-[#FAF9F6] transition-colors">
      {/* Header bar with hide/show toggle */}
      <div className="flex items-center justify-between px-3.5 py-1.5 select-none">
        <button
          type="button"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-controls="copilot-suggestions-body"
          className="flex items-center gap-1.5 text-left text-[11px] font-semibold text-slate-800 hover:text-[#0078d4] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0078d4]/40 rounded px-1 -ml-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0078d4] shrink-0" />
          <span>Suggested Inquiries</span>
          <span className="text-[10px] text-slate-500 font-normal">
            ({CURATED_SUGGESTIONS.length})
          </span>
        </button>

        <button
          type="button"
          onClick={toggleExpand}
          aria-label={isExpanded ? 'Hide suggestions' : 'Show suggestions'}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 hover:bg-slate-200/60 transition-colors"
        >
          <span>{isExpanded ? 'Hide' : 'Show'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Collapsible Suggestions Body */}
      {isExpanded && (
        <div
          id="copilot-suggestions-body"
          className="px-3.5 pb-2.5 pt-0.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in fade-in duration-150"
        >
          {CURATED_SUGGESTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onInsertPrompt(item.prompt)}
              title="Click to insert into prompt composer"
              aria-label={`Insert prompt: ${item.title}`}
              className="group text-left p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#0078d4]/40 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-semibold text-slate-900 group-hover:text-[#0078d4] transition-colors truncate">
                  {item.title}
                </span>
                <span className="shrink-0 text-[9px] font-medium text-[#005a9e] bg-[#deecf9] px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
                {item.desc}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

AiSuggestionsPanel.propTypes = {
  onInsertPrompt: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

