import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export function WorkspaceUnavailable({ message, onRetry }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fafc] px-5 text-slate-900">
      <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">Workspace Unavailable</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {message || "The dashboard data could not be loaded from the backend."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0078d4] hover:bg-[#005a9e] px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
        >
          <RefreshCw className="h-4 w-4" /> Retry Connection
        </button>
      </section>
    </main>
  );
}
