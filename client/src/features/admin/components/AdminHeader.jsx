import React, { useState } from "react";
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Bot,
  Sun,
  Moon,
  RotateCcw,
} from "lucide-react";
import nvCyclothonLogo from "../../../../assets/NV_Cyclothon_logo.png";
import { useTheme } from "../../../state/ThemeContext";

export function AdminHeader({
  onSignOut,
  mobileMenuOpen,
  onToggleMobileMenu,
  activeTabLabel = "Overview",
  onOpenAiCoPilot,
  onResetLayout,
}) {
  const [personaOpen, setPersonaOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="shrink-0 z-30 w-full border-b border-slate-200 dark:border-[#2A2D35] bg-white/95 dark:bg-[#18191E]/95 backdrop-blur-xs text-slate-900 dark:text-[#E8E8E8] shadow-xs">
      {/* Microsoft-inspired product accent */}
      <div className="h-1 bg-gradient-to-r from-[#0078d4] via-[#2b88d8] to-[#50e6ff] w-full" />
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* LEFT: Mobile Menu Button + Logo + Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-[#2A2D35] bg-slate-50 dark:bg-[#1E2026] text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-[#252830] lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 text-slate-950 dark:text-white" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>

          {/* NV Cyclothon Logo */}
          <a
            href="#/admin"
            className="shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0078d4] rounded-md p-0.5"
            title="NV Cyclothon Operations Portal"
          >
            <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-md border border-[#005a9e] bg-[#001b44] p-0.5 shadow-sm">
              <img
                src={nvCyclothonLogo}
                alt="NV Cyclothon"
                className="h-full w-full object-contain"
              />
            </div>
          </a>

          {/* Breadcrumb Separator */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-[#2A2D35]">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Console</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            <span className="inline-flex items-center rounded-sm bg-[#deecf9] dark:bg-[#004578]/40 border border-[#c7e0f4] dark:border-[#0078d4]/50 px-2.5 py-0.5 text-xs font-semibold text-[#005a9e] dark:text-[#50e6ff]">
              {activeTabLabel}
            </span>
          </div>
        </div>

        {/* CENTER: Mobile Section Title or Live Badge */}
        <div className="block md:hidden truncate px-2">
          <span className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wide">
            {activeTabLabel}
          </span>
        </div>

        {/* RIGHT: AI Co-Pilot + Theme Switcher + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Co-Pilot Header Trigger */}
          <button
            type="button"
            onClick={onOpenAiCoPilot}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#c7e0f4] dark:border-[#0078d4]/50 bg-[#deecf9] dark:bg-[#004578]/40 text-[#004578] dark:text-[#50e6ff] shadow-xs transition-colors hover:bg-[#c7e0f4] dark:hover:bg-[#004578]/60 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 dark:focus:ring-offset-[#18191E]"
            title="Open AI Operations Co-Pilot (⌘K)"
            aria-label="Open AI Operations Co-Pilot"
          >
            <span className="relative grid h-5 w-5 grid-cols-2 gap-px rounded-sm bg-white dark:bg-slate-900 p-0.5 shadow-xs" aria-hidden="true">
              <span className="bg-[#f25022]" />
              <span className="bg-[#7fba00]" />
              <span className="bg-[#00a4ef]" />
              <span className="bg-[#ffb900]" />
              <Bot className="absolute inset-0 m-auto h-3 w-3 text-[#005a9e] dark:text-[#50e6ff]" />
            </span>
          </button>

          {/* Live System Indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span>Live Operations</span>
          </div>

          {/* Theme Switcher Button: Placed immediately beside profile */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 dark:border-[#2A2D35] bg-slate-50 dark:bg-[#1E2026] text-slate-700 dark:text-amber-400 shadow-xs transition-colors hover:bg-slate-100 dark:hover:bg-[#252830] focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 dark:focus:ring-offset-[#18191E]"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? (
              <Moon className="h-4 w-4 text-amber-400 transition-transform hover:-rotate-12" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4 text-amber-600 transition-transform hover:rotate-45" aria-hidden="true" />
            )}
          </button>

          {/* Persona menu keeps account controls available without crowding the header. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPersonaOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0078d4] text-xs font-semibold text-white shadow-xs ring-2 ring-[#deecf9] dark:ring-[#004578] transition hover:bg-[#005a9e] focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2 dark:focus:ring-offset-[#18191E]"
              aria-label="Open administrator account menu"
              aria-expanded={personaOpen}
              aria-haspopup="menu"
            >
              AD
            </button>
            {personaOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-md border border-slate-200 dark:border-[#2A2D35] bg-white dark:bg-[#1C1E24] p-2 shadow-xl" role="menu">
                <div className="border-b border-slate-100 dark:border-[#2A2D35] px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#E8E8E8]">
                    Admin Operator <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9A9A9A]">Super Admin • Rewa</p>
                  <p className="mt-2 text-[11px] font-medium text-[#005a9e] dark:text-[#50e6ff]">Secure access-token session</p>
                </div>
                {onResetLayout && (
                  <button
                    type="button"
                    onClick={() => { setPersonaOpen(false); onResetLayout(); }}
                    className="mt-1 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-[#252830]"
                    role="menuitem"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Reset layout widths</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setPersonaOpen(false); onSignOut(); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-xs font-medium text-rose-700 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
