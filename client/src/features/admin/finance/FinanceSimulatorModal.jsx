import React, { useState, useMemo } from "react";
import { X, Calculator, ArrowRight, Target, TrendingUp, RotateCcw } from "lucide-react";

export function FinanceSimulatorModal({ open, onClose, defaultRiders = 400, defaultSponsors = 500000 }) {
  const [simRiders, setSimRiders] = useState(defaultRiders);
  const [simAvgTicket, setSimAvgTicket] = useState(850);
  const [simSponsors, setSimSponsors] = useState(defaultSponsors);

  const simulation = useMemo(() => {
    const regInflow = simRiders * simAvgTicket;
    const vendorExpo = 55000;
    const totalInflows = regInflow + simSponsors + vendorExpo;

    // Unit variable costs: Jersey (₹280) + Medal (₹120) + Hydration/Food (₹60) = ₹460
    const variableCostPerRider = 460;
    const totalVariableExpenses = simRiders * variableCostPerRider;

    // Fixed overheads: Prizes (₹1,00,000) + Route clearances (₹65,000) + Media (₹85,000) + Volunteer setup (₹48,000) + Ops (₹48,000) = ₹3,46,000
    const fixedExpenses = 346000;
    const totalExpenses = fixedExpenses + totalVariableExpenses;

    const netProfit = totalInflows - totalExpenses;
    const profitMargin = totalInflows > 0 ? Math.round((netProfit / totalInflows) * 100) : 0;

    const commercialFixedOffset = simSponsors + vendorExpo;
    const remainingFixed = Math.max(0, fixedExpenses - commercialFixedOffset);
    const contributionMargin = Math.max(100, simAvgTicket - variableCostPerRider);
    const breakEven = Math.ceil(remainingFixed / contributionMargin);

    return {
      totalInflows,
      regInflow,
      totalExpenses,
      variableCostPerRider,
      totalVariableExpenses,
      fixedExpenses,
      netProfit,
      profitMargin,
      breakEven,
    };
  }, [simRiders, simAvgTicket, simSponsors]);

  if (!open) return null;

  const isProfitable = simulation.netProfit >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F4F6F8] px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-[#0078d4]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Interactive Event P&L Simulator</h3>
              <p className="text-xs text-slate-500 font-medium">Model registration turnouts, sponsor funding, and cashflow break-even.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1"
            aria-label="Close simulator"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6">
          {/* SLIDERS GRID */}
          <div className="grid gap-5 sm:grid-cols-3 bg-[#FAF9F6] p-5 rounded-xl border border-slate-200">
            {/* Slider 1: Riders */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>Riders</span>
                <span className="font-mono text-[#0078d4] font-extrabold text-sm">{simRiders}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="25"
                value={simRiders}
                onChange={(e) => setSimRiders(Number(e.target.value))}
                aria-label="Simulate riders count"
                className="w-full accent-[#0078d4] cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-semibold block">Range: 50 – 2,000 riders</span>
            </div>

            {/* Slider 2: Avg Ticket Price */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>Avg Ticket</span>
                <span className="font-mono text-[#0078d4] font-extrabold text-sm">₹{simAvgTicket}</span>
              </div>
              <input
                type="range"
                min="300"
                max="1500"
                step="50"
                value={simAvgTicket}
                onChange={(e) => setSimAvgTicket(Number(e.target.value))}
                aria-label="Simulate average ticket price"
                className="w-full accent-[#0078d4] cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-semibold block">Range: ₹300 – ₹1,500</span>
            </div>

            {/* Slider 3: Sponsorships */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-900">
                <span>Sponsorships</span>
                <span className="font-mono text-[#0078d4] font-extrabold text-sm">₹{(simSponsors / 1000).toFixed(0)}k</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500000"
                step="50000"
                value={simSponsors}
                onChange={(e) => setSimSponsors(Number(e.target.value))}
                aria-label="Simulate sponsorship funding"
                className="w-full accent-[#0078d4] cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-semibold block">Range: ₹0 – ₹15 Lakhs</span>
            </div>
          </div>

          {/* SIMULATION RESULTS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase font-mono">Gross Inflow</span>
              <p className="mt-1 font-mono text-base font-black text-slate-900">
                ₹{simulation.totalInflows.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase font-mono">Total Outflows</span>
              <p className="mt-1 font-mono text-base font-black text-slate-900">
                ₹{simulation.totalExpenses.toLocaleString("en-IN")}
              </p>
            </div>

            <div className={`rounded-xl border p-3.5 text-center shadow-2xs ${
              isProfitable
                ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                : "border-rose-300 bg-rose-50 text-rose-950"
            }`}>
              <span className="text-xs font-bold uppercase font-mono">
                Net Surplus ({simulation.profitMargin}%)
              </span>
              <p className="mt-1 font-mono text-base font-black">
                {isProfitable ? "+" : ""}₹{simulation.netProfit.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-[#c7e0f4] bg-[#deecf9]/40 p-3.5 text-center shadow-2xs">
              <span className="text-xs font-bold text-[#005a9e] uppercase font-mono">Break-Even Point</span>
              <p className="mt-1 font-mono text-base font-black text-[#005a9e]">
                {simulation.breakEven} Riders
              </p>
            </div>
          </div>

          {/* SUMMARY STATEMENT */}
          <div className="rounded-xl border border-slate-200 bg-[#faf9f6] p-4 text-xs text-slate-800 space-y-2 leading-relaxed">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#0078d4]" />
              Scenario Analysis Takeaway:
            </p>
            <p>
              With <strong>{simRiders} riders</strong> at an average ticket of <strong>₹{simAvgTicket}</strong> and <strong>₹{simSponsors.toLocaleString("en-IN")}</strong> in sponsorship backing, your gross receipts will be <strong>₹{simulation.totalInflows.toLocaleString("en-IN")}</strong> against <strong>₹{simulation.totalExpenses.toLocaleString("en-IN")}</strong> in fixed and variable operational costs.
            </p>
            <p className="font-mono text-xs text-slate-600 font-semibold">
              Break-even is achieved at <strong>{simulation.breakEven} participants</strong>. Each additional participant yields <strong>+₹{Math.max(100, simAvgTicket - 460)}</strong> in pure cashflow contribution.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-[#FAF9F6] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0078d4] hover:bg-[#005a9e] px-5 py-2 text-xs font-bold text-white transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
