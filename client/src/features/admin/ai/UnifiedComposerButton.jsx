import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUp, Square } from 'lucide-react';

export function UnifiedComposerButton({ isGenerating, disabled, onSend, onStop }) {
  if (isGenerating) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="Stop generating (Esc)"
        aria-label="Stop generating response"
        className="h-8 w-8 rounded-lg flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSend}
      disabled={disabled}
      title="Send message (Enter)"
      aria-label="Send prompt to assistant"
      className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}

UnifiedComposerButton.propTypes = {
  isGenerating: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onSend: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
};

UnifiedComposerButton.defaultProps = {
  disabled: false,
};
