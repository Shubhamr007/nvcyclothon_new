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
  RefreshCw,
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
  syncStatus = "connected",
  onRefresh,
}) {
  const [personaOpen, setPersonaOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="shrink-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xs text-slate-900 shadow-xs">
      {/* Microsoft-inspired product accent */}
      <div className="h-1 bg-gradient-to-r from-[#0078d4] via-[#2b88d8] to-[#50e6ff] w-full" />
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* LEFT: Mobile Menu Button + Logo + Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 transition hover:bg-slate-100 lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 text-slate-950" />
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
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="text-xs text-slate-700 font-bold">Console</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            <span className="inline-flex items-center rounded-sm bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 text-xs font-semibold text-[#005a9e]">
              {activeTabLabel}
            </span>
          </div>
        </div>

        {/* CENTER: Mobile Section Title or Live Badge */}
        <div className="block md:hidden truncate px-2">
          <span className="text-xs font-extrabold text-slate-950 uppercase tracking-wide">
            {activeTabLabel}
          </span>
        </div>

        {/* RIGHT: AI Co-Pilot + Theme Switcher + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Co-Pilot Header Trigger */}
          <button
            type="button"
            onClick={onOpenAiCoPilot}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#c7e0f4] bg-[#deecf9] text-[#004578] shadow-xs transition-colors hover:bg-[#c7e0f4] focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2"
            title="Open AI Operations Co-Pilot (⌘K)"
            aria-label="Open AI Operations Co-Pilot"
          >
            <span className="relative grid h-5 w-5 grid-cols-2 gap-px rounded-sm bg-white p-0.5 shadow-xs" aria-hidden="true">
              <span className="bg-[#f25022]" />
              <span className="bg-[#7fba00]" />
              <span className="bg-[#00a4ef]" />
              <span className="bg-[#ffb900]" />
              <Bot className="absolute inset-0 m-auto h-3 w-3 text-[#005a9e]" />
            </span>
          </button>

          {/* Real-Time Live / Polling Sync Status & Manual Refresh Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 py-1 pl-3 pr-1.5 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 font-medium">
              {syncStatus === "connected" && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span className="text-emerald-800 font-semibold font-mono text-[11px]">Live Push</span>
                </>
              )}
              {syncStatus === "polling" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-800 font-medium font-mono text-[11px]">Fallback Polling</span>
                </>
              )}
              {syncStatus === "syncing" && (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-[#0078d4]" />
                  <span className="text-[#005a9e] font-semibold font-mono text-[11px]">Syncing...</span>
                </>
              )}
              {syncStatus === "disconnected" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="text-slate-600 font-medium font-mono text-[11px]">Offline</span>
                </>
              )}
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:text-[#0078d4] hover:bg-white transition-colors"
                title="Refresh Workspace Data"
                aria-label="Refresh Workspace Data"
              >
                <RefreshCw className={`h-3 w-3 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          {/* Theme Switcher Button: Placed immediately beside profile */}
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 shadow-xs transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? (
              <Moon className="h-4 w-4 text-amber-500 transition-transform hover:-rotate-12" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4 text-amber-600 transition-transform hover:rotate-45" aria-hidden="true" />
            )}
          </button>

          {/* Persona menu keeps account controls available without crowding the header. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPersonaOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0078d4] text-xs font-semibold text-white shadow-xs ring-2 ring-[#deecf9] transition hover:bg-[#005a9e] focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:ring-offset-2"
              aria-label="Open administrator account menu"
              aria-expanded={personaOpen}
              aria-haspopup="menu"
            >
              AD
            </button>
            {personaOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl" role="menu">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    Admin Operator <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">Super Admin • Rewa</p>
                  <p className="mt-2 text-[11px] font-medium text-[#005a9e]">Secure access-token session</p>
                </div>
                {onResetLayout && (
                  <button
                    type="button"
                    onClick={() => { setPersonaOpen(false); onResetLayout(); }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    role="menuitem"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reset layout widths</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setPersonaOpen(false); onSignOut(); }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-50"
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
