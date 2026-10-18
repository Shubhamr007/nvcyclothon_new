import React, { useEffect, memo } from "react";
import { Sparkles, Bot } from "lucide-react";

/**
 * Floating Action Trigger for Admin AI Co-Pilot.
 * Pinned at the bottom-right of the admin workspace with keyboard shortcut (⌘K / Ctrl+K).
 */
export const AdminAiFloatingTrigger = memo(function AdminAiFloatingTrigger({
  onClick,
  isOpen = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClick?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClick]);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <button
        type="button"
        onClick={onClick}
        aria-label="Open AI Operations Co-Pilot (⌘K)"
        className="group relative flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-2.5 text-white shadow-xl hover:bg-slate-800 hover:shadow-2xl transition-all duration-200 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
        </span>
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600/60 text-indigo-200">
          <Sparkles className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <span className="text-xs font-bold tracking-wide">AI Co-Pilot</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300 border border-slate-700/60">
          ⌘K
        </span>
      </button>
    </div>
  );
});
