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
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-white space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="uppercase tracking-wider font-semibold text-[#d9ff38]">
          Public Website Live Preview
        </span>
        <span>{capacity} spots</span>
      </div>
      <div className="flex items-baseline justify-between pt-0.5">
        <span className="text-sm font-black text-white">
          {meta.key === "Kid-o-thon" ? `₹${regularRupees} fixed fee` : `₹${earlyBirdRupees} early bird`}
        </span>
        <span className="text-[10px] text-amber-300 font-bold">
          {ageBadgeText}
        </span>
      </div>
      <p className="text-[10px] text-slate-400 truncate">
        {meta.key === "Kid-o-thon"
          ? `₹${regularRupees} fixed fee · Parent supervision required`
          : `₹${earlyBirdRupees} early bird · ₹${regularRupees} regular · ₹${lastWeekRupees} last week`}
      </p>
    </div>
  );
});

export default CategoryPreviewCard;
