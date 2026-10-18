import React, { memo } from "react";
import { CategoryAgeControls } from "./CategoryAgeControls";
import { CategoryPricingTiers } from "./CategoryPricingTiers";
import { CategoryPreviewCard } from "./CategoryPreviewCard";

/**
 * Individual Category Configuration Card.
 * Combines distance badge, tagline, age eligibility controls, pricing tiers, quota, and live preview.
 */
export const CategoryCard = memo(function CategoryCard({ meta, cat, onUpdateCategory }) {
  const minAge = cat?.min_age !== undefined && cat?.min_age !== null ? cat.min_age : "";
  const maxAge = cat?.max_age !== undefined && cat?.max_age !== null ? cat.max_age : "";
  const capacity = cat?.capacity || 100;
  const earlyBirdRupees = Math.round((cat?.early_bird ?? 89900) / 100);
  const regularRupees = Math.round((cat?.regular ?? 109900) / 100);
  const lastWeekRupees = Math.round((cat?.last_week ?? 129900) / 100);

  const ageBadgeText = maxAge
    ? `Ages ${minAge || 10}–${maxAge}`
    : minAge
      ? `Age ${minAge}+`
      : "All Ages";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5 transition hover:border-slate-300">
      {/* CARD HEADER */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white tracking-wider">
              {meta.distanceTag}
            </span>
            <h4 className="text-sm font-bold text-slate-900">{meta.key}</h4>
          </div>
          <p className="text-[11px] text-slate-500">{meta.tagline}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${meta.pillClass}`}>
            {ageBadgeText}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {capacity} spots
          </span>
        </div>
      </div>

      {/* AGE RESTRICTIONS */}
      <CategoryAgeControls
        categoryKey={meta.key}
        minAge={minAge}
        maxAge={maxAge}
        onUpdateCategory={onUpdateCategory}
      />

      {/* REGISTRATION FEES */}
      <CategoryPricingTiers
        categoryKey={meta.key}
        earlyBirdRupees={earlyBirdRupees}
        regularRupees={regularRupees}
        lastWeekRupees={lastWeekRupees}
        onUpdateCategory={onUpdateCategory}
      />

      {/* RIDER CAPACITY */}
      <div className="grid grid-cols-2 gap-3 items-center pt-1 border-t border-slate-100">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Rider Capacity / Quota
          </label>
          <span className="text-[10px] text-slate-400">Maximum registered participants</span>
        </div>
        <input
          type="number"
          min="1"
          max="10000"
          value={capacity}
          onChange={(e) =>
            onUpdateCategory(meta.key, "capacity", Math.max(1, Number(e.target.value) || 1))
          }
          className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
        />
      </div>

      {/* LIVE PUBLIC PREVIEW */}
      <CategoryPreviewCard
        meta={meta}
        capacity={capacity}
        earlyBirdRupees={earlyBirdRupees}
        regularRupees={regularRupees}
        lastWeekRupees={lastWeekRupees}
        ageBadgeText={ageBadgeText}
      />
    </div>
  );
});

export default CategoryCard;
