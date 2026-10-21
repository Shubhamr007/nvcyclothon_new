import React, { memo } from 'react';
import PropTypes from 'prop-types';

export const CONTEXT_PILLS = [
  { label: '+ Table', text: 'Format the response as a clear markdown table.' },
  { label: '+ Summarize', text: 'Provide a concise executive summary.' },
  { label: '+ Official note', text: 'Draft as an official RDCA administrative note.' },
  { label: '+ Financials', text: 'Include verified budget metrics and surplus.' },
];

export const ComposerContextPills = memo(function ComposerContextPills({ onAddContext }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
      <span className="text-[10px] font-medium text-slate-500 shrink-0 mr-0.5 select-none">
        Context:
      </span>
      {CONTEXT_PILLS.map((pill, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onAddContext(pill.text)}
          className="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-[#faf9f6] text-slate-600 hover:text-[#0078d4] border border-slate-200 hover:border-[#0078d4]/40 transition-all"
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
});

ComposerContextPills.propTypes = {
  onAddContext: PropTypes.func.isRequired,
};
