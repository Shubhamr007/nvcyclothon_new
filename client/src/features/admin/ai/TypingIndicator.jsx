import React, { memo } from "react";
import { Sparkles, Square } from "lucide-react";

/**
 * TypingIndicator Component.
 * Modern three-dot bouncing/pulsing generation indicator inside an assistant message bubble.
 * Respects reduced-motion preferences and provides accessible live region announcements.
 */
export const TypingIndicator = memo(function TypingIndicator({
  label = "Thinking…",
  onCancel,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI assistant is generating response"
      className="flex gap-3 justify-start items-center animate-in fade-in duration-200"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white shadow-2xs"
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </div>

      <div className="rounded-2xl rounded-bl-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 shadow-xs flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1 py-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.32s] motion-reduce:animate-none motion-reduce:opacity-60" />
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.16s] motion-reduce:animate-none motion-reduce:opacity-80" />
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce motion-reduce:animate-none motion-reduce:opacity-100" />
        </div>

        {label && (
          <span className="font-medium text-slate-600 dark:text-slate-400 select-none text-[11px]">
            {label}
          </span>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Stop generating response"
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-2xs"
          >
            <Square className="h-2.5 w-2.5 fill-current" />
            <span>Stop</span>
          </button>
        )}
      </div>

      <span className="sr-only">AI assistant is generating response…</span>
    </div>
  );
});
