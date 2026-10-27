import React from "react";
import {
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";

export function ParticipantDirectoryToolbar({
  totalCount = 0,
  approvedCount = 0,
  checkedInCount = 0,
  searchText = "",
  onSearchChange,
  onSearchTextChange,
  routeFilter = "all",
  onRouteChange,
  routes,
  uniqueRoutes = [],
  statusFilter = "all",
  onStatusChange,
  paymentFilter = "all",
  onPaymentChange,
  certificateFilter = "all",
  onCertificateChange,
  onCertificateFilterChange,
  certificateCounts = {},
  selectedCount = 0,
  busy = false,
  onDeleteSelected,
}) {
  const handleSearch = onSearchTextChange || onSearchChange || (() => {});
  const handleCertificate = onCertificateChange || onCertificateFilterChange || (() => {});
  const handleRoute = onRouteChange || (() => {});
  const handleStatus = onStatusChange || (() => {});
  const routeList = (routes && routes.length > 0) ? routes : uniqueRoutes;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Participant Directory</h2>
          <p className="text-xs text-slate-500">
            Compact overview of all riders. Click a row or Details to open the participant panel.
          </p>
        </div>

        {/* HIGH-CONTRAST TOTAL SUMMARY BADGES */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-[#deecf9] text-[#005a9e] border border-[#c7e0f4] px-3 py-1 font-mono font-semibold">
            Total: {totalCount}
          </span>
          <span className="rounded-lg bg-blue-50 text-[#005a9e] border border-blue-200 px-3 py-1 font-medium">
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, ID, phone, city..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ROUTE FILTER */}
        <select
          value={routeFilter}
          onChange={(e) => handleRoute(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
        >
          <option value="all">All Routes</option>
          {routeList.map((route) => (
            <option key={route} value={route}>
              {route}
            </option>
          ))}
        </select>

        {/* PAYMENT FILTER */}
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentChange?.(e.target.value)}
          aria-label="Filter by payment status"
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
        >
          <option value="all">All Payment States</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Not paid</option>
          <option value="pending">Payment pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatus(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
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
          onChange={(e) => handleCertificate(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
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

    </div>
  );
}
