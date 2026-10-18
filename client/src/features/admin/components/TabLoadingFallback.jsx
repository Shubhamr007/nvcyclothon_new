import React from "react";
import { Loader2 } from "lucide-react";

export function TabLoadingFallback({ label = "Loading tab contents..." }) {
  return (
    <div className="w-full space-y-6 animate-pulse p-2 sm:p-4" aria-busy="true" aria-label={label}>
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-200/60 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200/60 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200/70 p-4 space-y-3">
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-7 w-28 bg-slate-200/70 rounded" />
          </div>
        ))}
      </div>

      {/* Table / Content placeholder */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 min-h-[300px] flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
