import React, { memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { EventDayRaceRosterRow } from "./EventDayRaceRosterRow";

/**
 * Clean, lightweight, print-optimized Roster Table with pagination footer.
 */
export const RosterTable = memo(function RosterTable({
  riders = [],
  paginatedRiders = [],
  selectedRosterIds = [],
  onToggleSelectRider,
  onToggleSelectAll,
  onShowQr,
  page = 1,
  totalPages = 1,
  pageSize = 25,
  onPageChange,
}) {
  const handlePrevPage = useCallback(() => {
    onPageChange(Math.max(1, page - 1));
  }, [onPageChange, page]);

  const handleNextPage = useCallback(() => {
    onPageChange(Math.min(totalPages, page + 1));
  }, [onPageChange, page, totalPages]);

  const isAllSelected =
    paginatedRiders.length > 0 &&
    paginatedRiders.every((r) => selectedRosterIds.includes(r.id));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs print:border-none print:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 print:bg-neutral-100 print:text-black">
              <th className="py-3 px-3 text-center w-10 print:hidden">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="accent-[#0078d4] h-4 w-4 rounded cursor-pointer"
                  aria-label="Select all on this page"
                />
              </th>
              <th className="py-3 px-3 font-mono font-semibold text-center w-16 text-slate-700 print:text-black">ID</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Rider Name</th>
              <th className="py-3 px-3 font-semibold text-center text-slate-700">Age / Gender</th>
              <th className="py-3 px-4 font-semibold text-slate-700">Route Category</th>
              <th className="py-3 px-3 font-semibold text-center text-slate-700">Batch / Wave</th>
              <th className="py-3 px-3 font-semibold text-center text-slate-700">Jersey</th>
              <th className="py-3 px-3 font-semibold text-slate-700">Contact</th>
              <th className="py-3 px-3 font-semibold text-slate-700">Emergency Contact</th>
              <th className="py-3 px-3 font-semibold text-slate-700">City / Org</th>
              <th className="py-3 px-3 font-semibold text-center text-slate-700">Check-In</th>
              <th className="py-3 px-3 font-semibold text-center w-16 print:hidden text-slate-700">Pass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRiders.length === 0 ? (
              <tr>
                <td colSpan="12" className="py-12 text-center text-slate-400">
                  No riders match the selected route and age filters.
                </td>
              </tr>
            ) : (
              paginatedRiders.map((rider, index) => (
                <EventDayRaceRosterRow
                  key={rider.id}
                  rider={rider}
                  index={index}
                  isSelected={selectedRosterIds.includes(rider.id)}
                  onToggleSelect={onToggleSelectRider}
                  onShowQr={onShowQr}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ROSTER PAGINATION BAR */}
      {riders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200 bg-slate-50 text-xs print:hidden">
          <span className="text-slate-600 font-medium">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, riders.length)} of{" "}
            {riders.length} riders
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={handlePrevPage}
              className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
            </Button>
            <span className="px-2 font-mono font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={handleNextPage}
              className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Next <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default RosterTable;
