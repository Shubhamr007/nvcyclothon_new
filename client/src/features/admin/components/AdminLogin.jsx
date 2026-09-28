import React, { useState } from "react";
import { Lock, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import nvCyclothonLogo from "../../../../assets/NV_Cyclothon_logo.png";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Button } from "../../../components/ui/button";

export function AdminLogin({ onLogin, message, loading }) {
  const [keyValue, setKey] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    if (keyValue.trim() && !loading) {
      onLogin(keyValue);
    }
  };

  return (
    <main
      data-theme="dark"
      className="relative flex min-h-screen items-center justify-center bg-[#071313] p-4 text-white overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-[#ff5f3d]/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-[#d9ff38]/10 blur-[140px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#071313]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-24 rounded-xl bg-white/10 p-2 border border-white/15 flex items-center justify-center">
            <img
              src={nvCyclothonLogo}
              alt="NV Cyclothon"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-[#d9ff38]/30 bg-[#d9ff38]/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#d9ff38]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>STAFF OPERATIONS CONSOLE</span>
          </div>

          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl font-display">
            Admin Access
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Enter the authorized event administrator key to access registration, partner, and volunteer controls.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1"
            >
              Administrator Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                id="admin-password"
                type="password"
                value={keyValue}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter password..."
                className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#d9ff38] focus:outline-none"
                autoComplete="current-password"
                autoFocus
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 font-medium">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !keyValue.trim()}
            variant="accent"
            className="w-full h-11 font-black uppercase tracking-wider text-xs"
          >
            {loading ? (
              <LoadingIndicator label="Authenticating…" className="text-[#071313]" />
            ) : (
              <span className="flex items-center gap-2">
                Open Control Center <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] text-white/40 font-mono">
          NV CYCLOTHON 2026 • REWA, MADHYA PRADESH
        </p>
      </div>
    </main>
  );
}
