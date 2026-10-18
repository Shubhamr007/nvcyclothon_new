import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function DualBarChart({
  inflowTotal = 0,
  outflowTotal = 0,
  inflowLabel = "Gross Inflow (Revenue)",
  outflowLabel = "Gross Outflow (Expenses)",
  comparisons = [],
}) {
  const maxVal = Math.max(inflowTotal, outflowTotal, 1);
  const inflowPercent = Math.round((inflowTotal / maxVal) * 100);
  const outflowPercent = Math.round((outflowTotal / maxVal) * 100);

  return (
    <div
      role="region"
      aria-label="Cash Inflow vs Outflow Comparative Chart"
      tabIndex={0}
      className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
    >
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <span className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
          Cash Inflow vs. Outflow Comparative
        </span>
        <span className="text-xs font-mono font-bold text-slate-700">
          Scale max: ₹{maxVal.toLocaleString("en-IN")}
        </span>
      </div>

      {/* PRIMARY COMPARATIVE BARS */}
      <div className="space-y-3.5">
        {/* Inflow Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-700 shrink-0" />
              {inflowLabel}
            </span>
            <span className="font-mono font-extrabold text-slate-950 text-sm">
              ₹{inflowTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-200 border border-slate-300/80 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${inflowPercent}%` }}
              title={`Inflow: ${inflowPercent}%`}
            />
          </div>
        </div>

        {/* Outflow Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-950 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-rose-700 shrink-0" />
              {outflowLabel}
            </span>
            <span className="font-mono font-extrabold text-slate-950 text-sm">
              ₹{outflowTotal.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-slate-200 border border-slate-300/80 overflow-hidden">
            <div
              className="h-full bg-rose-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${outflowPercent}%` }}
              title={`Outflow: ${outflowPercent}%`}
            />
          </div>
        </div>
      </div>

      {/* SECONDARY STRATEGIC COMPARISONS */}
      {comparisons.length > 0 && (
        <div className="pt-2.5 border-t border-slate-200 space-y-2">
          {comparisons.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-800 font-medium truncate">{c.label}</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-950">₹{c.leftVal.toLocaleString("en-IN")}</span>
                <span className="text-slate-500 font-bold">vs</span>
                <span className="font-bold text-slate-800">₹{c.rightVal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
