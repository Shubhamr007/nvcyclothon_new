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
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Participant Directory</h2>
          <p className="text-xs text-slate-500">
            Compact overview of all riders. Click any row or the chevron to expand full logistics & QR details.
          </p>
        </div>

        {/* HIGH-CONTRAST TOTAL SUMMARY BADGES */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-slate-900 text-white px-3 py-1 font-mono font-medium">
            Total: {totalCount}
          </span>
          <span className="rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 font-medium">
            Approved: {approvedCount}
          </span>
          {/* HUMAN-READABLE CHECKED IN PILL */}
          <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Checked In: {checkedInCount}
          </span>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            placeholder="Search by name, ID, phone, city..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => onSearchTextChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ROUTE FILTER */}
        <select
          value={routeFilter}
          onChange={(e) => onRouteChange(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" /> Expand All on Page
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" /> Collapse All
          </button>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          {expandedCount} of {visibleCount} expanded
        </span>
      </div>
    </div>
  );
}
