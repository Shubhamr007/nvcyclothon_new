import React from "react";
import {
  Search,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";

export function ParticipantDirectoryToolbar({
  totalCount = 0,
  approvedCount = 0,
  checkedInCount = 0,
  searchText = "",
  onSearchTextChange,
  routeFilter = "all",
  onRouteChange,
  uniqueRoutes = [],
  statusFilter = "all",
  onStatusChange,
  certificateFilter = "all",
  onCertificateChange,
  certificateCounts = {},
  selectedCount = 0,
  busy = false,
  onDeleteSelected,
  onExpandAll,
  onCollapseAll,
  expandedCount = 0,
  visibleCount = 0,
}) {
  return (
    <div className="rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#071313]">Participant Directory</h2>
          <p className="text-xs text-[#071313]/60">
            Compact overview of all riders. Click any row or the chevron to expand full logistics & QR details.
          </p>
        </div>

        {/* HIGH-CONTRAST TOTAL SUMMARY BADGES */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-[#071313] text-white px-3 py-1 font-mono font-bold">
            Total: {totalCount}
          </span>
          <span className="rounded-lg bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1 font-bold">
            Approved: {approvedCount}
          </span>
          {/* HUMAN-READABLE CHECKED IN PILL */}
          <span className="rounded-lg bg-emerald-600 text-white shadow-sm px-3 py-1 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Checked In: {checkedInCount}
          </span>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            placeholder="Search by name, ID, phone, city..."
            className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-8 text-xs text-[#071313] placeholder:text-black/40 focus:border-[#071313] focus:outline-none"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => onSearchTextChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ROUTE FILTER */}
        <select
          value={routeFilter}
          onChange={(e) => onRouteChange(e.target.value)}
          className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
        >
          <option value="all">All Routes</option>
          {uniqueRoutes.map((route) => (
            <option key={route} value={route}>
              {route}
            </option>
          ))}
        </select>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="checked_in">Checked In</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* CERTIFICATE FILTER */}
        <select
          value={certificateFilter}
          onChange={(e) => onCertificateChange(e.target.value)}
          className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
        >
          <option value="all">Certificate: All ({certificateCounts.all || 0})</option>
          <option value="sent">Certificate: Sent ({certificateCounts.sent || 0})</option>
          <option value="failed">Certificate: Failed ({certificateCounts.failed || 0})</option>
          <option value="not_sent">Certificate: Not Sent ({certificateCounts.not_sent || 0})</option>
        </select>
      </div>

      <SelectedDeleteAction
        count={selectedCount}
        label="participant"
        busy={busy}
        onDelete={onDeleteSelected}
      />

      {/* EXPAND ALL / COLLAPSE ALL TOGGLES */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-black/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="font-bold text-[#071313] hover:text-[#ff5f3d] flex items-center gap-1"
          >
            <ChevronDown className="h-3.5 w-3.5" /> Expand All on Page
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="font-bold text-[#071313] hover:text-[#ff5f3d] flex items-center gap-1"
          >
            <ChevronUp className="h-3.5 w-3.5" /> Collapse All
          </button>
        </div>
        <span className="font-mono text-[11px] text-black/40">
          {expandedCount} of {visibleCount} expanded
        </span>
      </div>
    </div>
  );
}
