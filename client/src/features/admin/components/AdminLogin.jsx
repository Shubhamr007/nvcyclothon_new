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
      className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-indigo-600/10 blur-[150px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-28 rounded-xl bg-white/5 p-2 border border-slate-700 flex items-center justify-center">
            <img
              src={nvCyclothonLogo}
              alt="NV Cyclothon"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>STAFF OPERATIONS CONSOLE</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Admin Access
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Enter the authorized event administrator key to access registration, partner, and volunteer controls.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1"
            >
              Administrator Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="admin-password"
                type="password"
                value={keyValue}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter password..."
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                autoComplete="current-password"
                autoFocus
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !keyValue.trim()}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold tracking-wide text-xs rounded-xl shadow-sm transition"
          >
            {loading ? (
              <LoadingIndicator label="Authenticating…" className="text-white" inline />
            ) : (
              <span className="flex items-center gap-2">
                Open Control Center <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] text-slate-500 font-mono">
          NV CYCLOTHON 2026 • REWA, MADHYA PRADESH
        </p>
      </div>
    </main>
  );
}
