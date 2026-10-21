import React, { memo } from "react";
import { Shield, Minus, Plus } from "lucide-react";

/**
 * Stepper and input controls for minimum & maximum age eligibility restrictions.
 */
export const CategoryAgeControls = memo(function CategoryAgeControls({
  categoryKey,
  minAge,
  maxAge,
  onUpdateCategory,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-slate-600" />
          Age Eligibility Restrictions
        </span>
        <span className="text-[10px] text-slate-500">Live age checks</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* MIN AGE */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Minimum Age (Years)
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const currentVal = Number(minAge) || 10;
                onUpdateCategory(categoryKey, "min_age", Math.max(5, currentVal - 1));
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
              title="Decrease minimum age"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min="5"
              max="90"
              value={minAge}
              onChange={(e) =>
                onUpdateCategory(
                  categoryKey,
                  "min_age",
                  e.target.value === "" ? null : Math.max(5, Number(e.target.value))
                )
              }
              placeholder="None"
              className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-center text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const currentVal = Number(minAge) || 10;
                onUpdateCategory(categoryKey, "min_age", Math.min(80, currentVal + 1));
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
              title="Increase minimum age"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="block text-[10px] text-slate-400 mt-1">E.g. 18 for road challenge</span>
        </div>

        {/* MAX AGE */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-bold uppercase text-slate-600">
              Maximum Age (Years)
            </label>
            {maxAge && (
              <button
                type="button"
                onClick={() => onUpdateCategory(categoryKey, "max_age", null)}
                className="text-[9px] text-rose-600 hover:underline"
              >
                Remove cap
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const currentVal = maxAge ? Number(maxAge) : 70;
                onUpdateCategory(categoryKey, "max_age", Math.max(10, currentVal - 1));
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
              title="Decrease maximum age"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min="10"
              max="100"
              value={maxAge}
              onChange={(e) =>
                onUpdateCategory(
                  categoryKey,
                  "max_age",
                  e.target.value === "" ? null : Math.max(10, Number(e.target.value))
                )
              }
              placeholder="No limit"
              className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-center text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const currentVal = maxAge ? Number(maxAge) : 18;
                onUpdateCategory(categoryKey, "max_age", Math.min(100, currentVal + 1));
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
              title="Increase maximum age"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="block text-[10px] text-slate-400 mt-1">E.g. 13 for Kid-o-thon</span>
        </div>
      </div>
    </div>
  );
});

export default CategoryAgeControls;
