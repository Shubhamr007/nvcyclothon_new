import React, { memo } from "react";

/**
 * Public website live preview card showing how the category will appear to registrants.
 */
export const CategoryPreviewCard = memo(function CategoryPreviewCard({
  meta,
  capacity,
  earlyBirdRupees,
  regularRupees,
  lastWeekRupees,
  ageBadgeText,
  earlyBirdEnabled = true,
}) {
  const isEarlyBirdActive = earlyBirdEnabled !== false;

  return (
    <div className="rounded-xl border border-slate-200 bg-[#faf9f6] p-3 text-slate-900 space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="uppercase tracking-wider font-bold text-[#0078d4]">
          Public Website Live Preview
        </span>
        <span className="font-semibold">{capacity} spots</span>
      </div>
      <div className="flex items-baseline justify-between pt-0.5">
        <span className="text-sm font-black text-slate-900">
          {meta.key === "Kid-o-thon"
            ? `₹${regularRupees} fixed fee`
            : isEarlyBirdActive
              ? `₹${earlyBirdRupees} early bird`
              : `₹${regularRupees} regular`}
        </span>
        <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {ageBadgeText}
        </span>
      </div>
      <p className="text-[10px] text-slate-500 truncate">
        {meta.key === "Kid-o-thon"
          ? `₹${regularRupees} fixed fee · Parent supervision required`
          : isEarlyBirdActive
            ? `₹${earlyBirdRupees} early bird · ₹${regularRupees} regular · ₹${lastWeekRupees} last week`
            : `₹${regularRupees} regular · ₹${lastWeekRupees} last week (Early bird disabled)`}
      </p>
    </div>
  );
});

export default CategoryPreviewCard;
