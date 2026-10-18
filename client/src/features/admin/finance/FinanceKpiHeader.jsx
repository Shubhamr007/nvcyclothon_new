import React from "react";
import { TrendingUp, TrendingDown, Target, Calculator, Sparkles, FileText, Download } from "lucide-react";

export function FinanceKpiHeader({
  summary,
  onOpenSimulator,
  onOpenAiAudit,
  onOpenAuditReport,
  onDownloadExcel,
  downloadingExcel,
}) {
  const isProfitable = summary.netProfit >= 0;

  return (
    <div className="space-y-4">
      {/* ACTION TOOLBAR STRIP */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            Event Financial Command & P&L Calculator
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Real-time balance sheet integrating live registrations, sponsor funding, prize pools, and route logistics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownloadExcel}
            disabled={downloadingExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs shadow-emerald-600/20 transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
            title="Download multi-sheet audit workbook for CA"
            aria-label="Export CA Excel Workbook"
          >
            <Download className="h-4 w-4 text-white" />
            <span>{downloadingExcel ? "Exporting…" : "Export CA Excel"}</span>
          </button>
          <button
            type="button"
            onClick={onOpenAuditReport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 px-3.5 py-2 text-xs font-bold shadow-xs transition focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
            title="Open printable CA & Board Audit Report"
            aria-label="Open CA & Board Audit Statement"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>CA Audit Statement</span>
          </button>
          <button
            type="button"
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition focus-visible:outline-2 focus-visible:outline-slate-800 focus-visible:outline-offset-2"
            aria-label="Open What-If Scenario Simulator"
          >
            <Calculator className="h-4 w-4 text-slate-600" />
            <span>Simulator</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiAudit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold text-indigo-900 shadow-xs transition focus-visible:outline-2 focus-visible:outline-indigo-700 focus-visible:outline-offset-2"
            aria-label="Run AI Budget Health & Risk Check"
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>AI Risk Check</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC TILES (RICH CORPORATE WCAG AAA) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARD 1: GROSS REVENUE */}
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-emerald-950">
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-emerald-950">
              TOTAL GROSS REVENUE
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-mono">
            ₹{summary.grossRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600 leading-normal">
            ₹{summary.regRevenue.toLocaleString("en-IN")} tickets + ₹{(summary.sponsorRevenue + summary.vendorRevenue + summary.delegationRevenue).toLocaleString("en-IN")} commercial
          </p>
        </div>

        {/* CARD 2: GROSS EXPENSES */}
        <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/50 via-white to-white p-5 shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-rose-950">
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-rose-950">
              TOTAL GROSS EXPENSES
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-mono">
            ₹{summary.grossExpenses.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600 leading-normal">
            Prize pool, route security, media & logistics
          </p>
        </div>

        {/* CARD 3: NET SURPLUS / PROFIT */}
        <div
          className={`rounded-2xl border p-5 shadow-xs transition ${
            isProfitable
              ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-white hover:border-emerald-300"
              : "border-rose-200/90 bg-gradient-to-br from-rose-50/80 via-white to-white hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-extrabold tracking-wider uppercase font-mono ${
                isProfitable ? "text-emerald-950" : "text-rose-950"
              }`}
            >
              NET SURPLUS / MARGIN
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-xs font-black font-mono shadow-2xs ${
                isProfitable ? "bg-emerald-700 text-white" : "bg-rose-700 text-white"
              }`}
            >
              {summary.profitMargin}%
            </span>
          </div>
          <p
            className={`mt-3 text-2xl sm:text-3xl font-black tracking-tight font-mono ${
              isProfitable ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {isProfitable ? "+" : ""}₹{summary.netProfit.toLocaleString("en-IN")}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-800 leading-normal">
            {isProfitable ? "✓ Healthy event surplus reserve" : "⚠ Current budget deficit — needs funding"}
          </p>
        </div>

        {/* CARD 4: UNIT ECONOMICS & BREAK-EVEN */}
        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/50 via-white to-white p-5 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-blue-950">
            <span className="text-xs font-extrabold tracking-wider uppercase font-mono text-blue-950">
              BREAK-EVEN TARGET
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-mono">
            {summary.breakEvenRiders}{" "}
            <span className="text-sm font-bold text-slate-600">Riders</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Avg Fee: ₹{summary.avgTicket}</span>
            <span>Cost/Rider: ₹{summary.costPerRider}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
