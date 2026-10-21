import React, { useMemo } from "react";
import { Coins, TrendingUp, AlertCircle, CheckCircle2, Ticket } from "lucide-react";

/**
 * Top summary strip calculating live revenue and payment metrics from registered riders.
 */
export function ParticipantFinanceSummaryStrip({ riders = [] }) {
  const metrics = useMemo(() => {
    let totalCollectedPaise = 0;
    let totalPendingPaise = 0;
    let paidCount = 0;
    let pendingCount = 0;
    const categoryBreakdown = {};

    riders.forEach((rider) => {
      // Amount in paise (fallback to default fee if not explicitly set)
      let feePaise = Number(rider.registration_fee_paise);
      if (Number.isNaN(feePaise) || feePaise <= 0) {
        if (rider.ride_category?.includes("60")) feePaise = 109900;
        else if (rider.ride_category?.includes("30")) feePaise = 99900;
        else if (rider.ride_category?.includes("10")) feePaise = 49900;
        else feePaise = 29900;
      }

      const catName = rider.ride_category || "Standard";
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { count: 0, collectedPaise: 0 };
      }

      if (rider.payment_status === "paid") {
        paidCount += 1;
        totalCollectedPaise += feePaise;
        categoryBreakdown[catName].count += 1;
        categoryBreakdown[catName].collectedPaise += feePaise;
      } else {
        pendingCount += 1;
        totalPendingPaise += feePaise;
      }
    });

    const totalCollected = Math.round(totalCollectedPaise / 100);
    const totalPending = Math.round(totalPendingPaise / 100);
    const avgTicket = paidCount > 0 ? Math.round(totalCollected / paidCount) : 0;
    const collectionRate = riders.length > 0 ? Math.round((paidCount / riders.length) * 100) : 0;

    return {
      totalCollected,
      totalPending,
      paidCount,
      pendingCount,
      avgTicket,
      collectionRate,
      categoryBreakdown,
    };
  }, [riders]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Headline & Total Inflow */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-inner">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-emerald-700 uppercase font-mono">
                REGISTRATIONS REVENUE INFLOW
              </span>
              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-mono font-bold border border-emerald-200">
                {metrics.collectionRate}% SETTLED
              </span>
            </div>
            <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono">
              ₹{metrics.totalCollected.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Right: 3 Key Financial Stat Badges */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 border-t border-slate-200 lg:border-t-0 pt-3 lg:pt-0">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs uppercase font-mono font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Paid Riders</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-black text-slate-900 font-mono">
              {metrics.paidCount}{" "}
              <span className="text-xs font-medium text-slate-500">/ {riders.length}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs uppercase font-mono font-bold">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Pending</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-black text-amber-600 font-mono">
              ₹{metrics.totalPending.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-medium text-slate-500">({metrics.pendingCount})</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs uppercase font-mono font-bold">
              <Ticket className="h-3.5 w-3.5 text-[#0078d4] shrink-0" />
              <span>Avg Ticket</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-black text-[#0078d4] font-mono">
              ₹{metrics.avgTicket.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
