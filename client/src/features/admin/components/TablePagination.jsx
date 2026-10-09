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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/10 bg-[#fbf8ef] p-4 text-xs">
      <div className="flex items-center gap-2 text-black/60">
        <span>
          Showing {startIdx} to {endIdx} of {totalItems} {itemLabel}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-7 rounded border border-black/15 bg-white px-1.5 text-xs text-[#071313]"
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
          className="h-8 px-2.5 text-xs"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" /> Prev
        </Button>
        <span className="font-mono font-bold text-xs px-2 text-[#071313]">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 text-xs"
        >
          Next <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
