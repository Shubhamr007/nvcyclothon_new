import React, { memo } from "react";
import { BookOpen } from "lucide-react";

/**
 * RagCitationsBadge component.
 * Displays retrieved vector knowledge source citations with similarity percentages.
 */
export const RagCitationsBadge = memo(function RagCitationsBadge({ citations = [] }) {
  if (!Array.isArray(citations) || citations.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-mono">
      <span className="font-semibold text-[#0078d4] flex items-center gap-1">
        <BookOpen className="h-3 w-3" />
        <span>Verified Event References:</span>
      </span>
      {citations.map((c, i) => (
        <span
          key={c.id || i}
          className="inline-flex items-center rounded-md bg-[#deecf9] border border-[#c7e0f4] px-2 py-0.5 text-[10px] font-semibold text-[#005a9e] shadow-2xs"
          title={c.title}
        >
          {c.title.split(",")[0].slice(0, 36)}
        </span>
      ))}
    </div>
  );
});
