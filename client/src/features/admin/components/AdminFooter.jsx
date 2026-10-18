import React from "react";
import { AiStatusIndicator } from "../ai/AiStatusIndicator";

export function AdminFooter() {
  return (
    <footer className="shrink-0 z-30 border-t border-slate-200/90 dark:border-[#2A2D35] bg-white/95 dark:bg-[#18191E]/95 backdrop-blur-xs text-slate-600 dark:text-slate-400 text-xs">
      <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
        {/* Left: Copyright & Organization */}
        <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
          <span className="font-bold text-slate-950 dark:text-white">
            © 2026 NV Cyclothon
          </span>
          <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Operations & Event Management Console</span>
          <span className="text-slate-300 dark:text-slate-600 font-bold hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-600 dark:text-slate-400 font-semibold">
            Rewa District Cycling Association (RDCA)
          </span>
        </div>

        {/* Center / Right: System Status */}
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
          <AiStatusIndicator />

          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-3 py-0.5 font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Core API Online</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">v2.4.0</span>
        </div>
      </div>
    </footer>
  );
}
