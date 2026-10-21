import React, { memo } from "react";
import { Info } from "lucide-react";

/**
 * AiAccuracyDisclaimer Component.
 * Displays a subtle, accessible notice informing users that AI responses
 * may contain mistakes and should be verified for mission-critical actions.
 */
export const AiAccuracyDisclaimer = memo(function AiAccuracyDisclaimer({
  className = "",
  compact = false,
}) {
  return (
    <aside
      role="note"
      aria-label="AI response accuracy disclaimer"
      className={`flex items-center justify-center gap-1.5 text-center text-slate-500 select-none transition-colors ${
        compact ? "py-1 px-2 text-[10px]" : "py-1.5 px-3 text-[11px]"
      } ${className}`}
    >
      <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="leading-tight">
        AI-generated responses may contain mistakes. Please verify important information before relying on it.
      </span>
    </aside>
  );
});
