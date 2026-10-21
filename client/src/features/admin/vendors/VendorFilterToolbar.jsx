import React, { memo } from "react";
import { Search } from "lucide-react";

export const VENDOR_STATUSES = [
  "all",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "EVENT_READY",
  "COMPLETED",
];

export const FilterPill = memo(function FilterPill({ status, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(status)}
      className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase transition whitespace-nowrap ${
        active
          ? "bg-[#0078d4] text-white shadow-xs"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      }`}
    >
      {status.replace(/_/g, " ")}
    </button>
  );
});

export const VendorFilterToolbar = memo(function VendorFilterToolbar({
  search = "",
  onSearchChange,
  filter = "all",
  onSelectFilter,
  statuses = VENDOR_STATUSES,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <div className="relative min-w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search vendor business, contact, products..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {statuses.map((st) => (
          <FilterPill
            key={st}
            status={st}
            active={filter === st}
            onSelect={onSelectFilter}
          />
        ))}
      </div>
    </div>
  );
});
