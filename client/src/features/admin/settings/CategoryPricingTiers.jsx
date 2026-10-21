import React, { memo } from "react";

/**
 * Fee tier editors for Early Bird, Regular, and Last Week pricing.
 */
export const CategoryPricingTiers = memo(function CategoryPricingTiers({
  categoryKey,
  earlyBirdRupees,
  regularRupees,
  lastWeekRupees,
  onUpdateCategory,
}) {
  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
        Registration Fee Tiers (₹ INR)
      </span>

      <div className="grid grid-cols-3 gap-2">
        {/* Early Bird */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            Early Bird (₹)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="10"
              value={earlyBirdRupees}
              onChange={(e) =>
                onUpdateCategory(
                  categoryKey,
                  "early_bird",
                  Math.max(0, Number(e.target.value) || 0) * 100
                )
              }
              className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            />
          </div>
        </div>

        {/* Regular */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            Regular (₹)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="10"
              value={regularRupees}
              onChange={(e) =>
                onUpdateCategory(
                  categoryKey,
                  "regular",
                  Math.max(0, Number(e.target.value) || 0) * 100
                )
              }
              className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            />
          </div>
        </div>

        {/* Last Week */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            Last Week (₹)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="10"
              value={lastWeekRupees}
              onChange={(e) =>
                onUpdateCategory(
                  categoryKey,
                  "last_week",
                  Math.max(0, Number(e.target.value) || 0) * 100
                )
              }
              className="h-8 w-full rounded-lg border border-slate-300 bg-white pl-6 pr-2 text-xs font-mono font-bold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default CategoryPricingTiers;
