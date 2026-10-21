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
    <main className="relative flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 text-slate-900 overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-[#0078d4]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-28 rounded-xl bg-white p-2 border border-slate-200 shadow-2xs flex items-center justify-center">
            <img
              src={nvCyclothonLogo}
              alt="NV Cyclothon"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="mt-4 flex items-center gap-1.5 rounded-full border border-[#c7e0f4] bg-[#deecf9] px-3 py-1 text-[11px] font-semibold tracking-wider text-[#005a9e]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>STAFF OPERATIONS CONSOLE</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin Access
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter the authorized event administrator key to access registration, partner, and volunteer controls.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Administrator Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="admin-password"
                type="password"
                value={keyValue}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter password..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none transition"
                autoComplete="current-password"
                autoFocus
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !keyValue.trim()}
            className="w-full h-11 bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold tracking-wide text-xs rounded-xl shadow-sm transition"
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

        <p className="mt-6 text-center text-[10px] text-slate-400 font-mono">
          NV CYCLOTHON 2026 • REWA, MADHYA PRADESH
        </p>
      </div>
    </main>
  );
}
