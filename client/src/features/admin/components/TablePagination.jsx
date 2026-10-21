import React from "react";
import { Button } from "../../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [15, 25, 50],
  itemLabel = "participants",
}) {
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-[#faf9f6] px-4 py-3 text-xs">
      <div className="flex items-center gap-2 text-slate-600">
        <span>
          Showing {startIdx} to {endIdx} of {totalItems} {itemLabel}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none shadow-xs"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} per page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-7 px-2.5 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0078d4]"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" /> Prev
        </Button>
        <span className="font-mono font-semibold text-xs px-2 text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-7 px-2.5 text-xs border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#0078d4]"
        >
          Next <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
