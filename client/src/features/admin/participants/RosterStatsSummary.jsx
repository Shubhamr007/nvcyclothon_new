import React, { memo } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Metric summary bar and page size selector for Event-Day Race Roster.
 */
export const RosterStatsSummary = memo(function RosterStatsSummary({
  stats = {},
  selectedCount = 0,
  pageSize = 25,
  onPageSizeChange,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-800">
          Matching Riders: <span className="font-bold text-base text-slate-900">{stats.total || 0}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Checked In: {stats.checkedIn || 0}
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-amber-700 font-semibold">
          Pending: {stats.pending || 0}
        </span>
        {stats.batched !== undefined && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-semibold">
              Batched: {stats.batched} | Unassigned: {stats.unbatched}
            </span>
          </>
        )}
        {selectedCount > 0 && (
          <>
            <span className="text-slate-300">•</span>
            <span className="rounded-md bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 font-bold">
              {selectedCount} Selected
            </span>
          </>
        )}
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">
          Male: {stats.male || 0} | Female: {stats.female || 0}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500">Show:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none"
        >
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
          <option value="500">500 per page</option>
        </select>
      </div>
    </div>
  );
});

export default RosterStatsSummary;
