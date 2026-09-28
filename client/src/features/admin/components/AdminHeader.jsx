import React from "react";
import { LogOut, ShieldCheck, Menu, X, Zap } from "lucide-react";
import nvCyclothonLogo from "../../../../assets/NV_Cyclothon_logo.png";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";

export function AdminHeader({
  onSignOut,
  mobileMenuOpen,
  onToggleMobileMenu,
  activeTabLabel = "Overview",
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#071313] text-white backdrop-blur-md shadow-md">
      <div className="mx-auto flex h-16 w-full max-w-[1520px] items-center justify-between px-4 sm:px-8">
        {/* Brand & Mobile Menu Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-[#d9ff38]" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <img
              src={nvCyclothonLogo}
              alt="NV Cyclothon"
              className="h-9 w-auto rounded-md object-contain bg-white/10 p-1 border border-white/10"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-black tracking-wider uppercase text-white">
                  NV CYCLOTHON <span className="text-[#d9ff38]">2026</span>
                </span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
                  OPERATIONS CONSOLE
                </span>
              </div>
              <p className="text-xs text-white/40 font-mono">Rewa, MP • Secure Control Room</p>
            </div>
          </div>
        </div>

        {/* Center / Current Section Title on Mobile */}
        <div className="block sm:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d9ff38]">
            {activeTabLabel}
          </span>
        </div>

        {/* Right Status Badge & Actions */}
        <div className="flex items-center gap-3">
          <Badge
            variant="accent"
            className="hidden md:inline-flex items-center gap-1.5 border-[#d9ff38]/40 bg-[#d9ff38]/10 px-3 py-1 text-[11px] font-bold tracking-wider text-[#d9ff38]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>AUTHENTICATED OPERATOR</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="border-white/20 bg-white/5 text-xs font-bold text-white hover:border-red-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
