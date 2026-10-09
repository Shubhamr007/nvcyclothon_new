import React from "react";
import {
  Search,
  CheckCircle2,
  Award,
  ChevronLeft,
  ChevronRight,
  QrCode,
  X,
  Clock,
  Phone,
  Download,
  Printer,
  Layers,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

export const AGE_BRACKETS = [
  { id: "all", label: "All Ages", min: null, max: null },
  { id: "10-13", label: "10 – 13 (Kids)", min: 10, max: 13 },
  { id: "14-17", label: "14 – 17 (Juniors)", min: 14, max: 17 },
  { id: "18-35", label: "18 – 35 (Open)", min: 18, max: 35 },
  { id: "36-49", label: "36 – 49 (Masters)", min: 36, max: 49 },
  { id: "50-plus", label: "50+ (Veterans)", min: 50, max: null },
  { id: "custom", label: "Custom Range…", min: null, max: null },
];

export function EventDayRaceRoster({
  riders = [],
  paginatedRiders = [],
  stats = {},
  routes = [],
  batches = [],
  searchText = "",
  onSearchChange,
  route = "all",
  onRouteChange,
  batch = "all",
  onBatchChange,
  ageBracket = "all",
  onAgeBracketChange,
  minAge = "",
  onMinAgeChange,
  maxAge = "",
  onMaxAgeChange,
  gender = "all",
  onGenderChange,
  status = "all",
  onStatusChange,
  page = 1,
  totalPages = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  onExport,
  onPrint,
  onShowQr,
  selectedRosterIds = [],
  onToggleSelectRider,
  onToggleSelectAll,
  onOpenBatchModal,
}) {
  return (
    <div className="space-y-6">
      {/* ROSTER CONFIGURATION CONTROL PANEL */}
      <div className="rounded-2xl border border-[#071313]/10 bg-white p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#ff5f3d]" />
              <h2 className="text-xl font-black text-[#071313]">Race Category & Age Roster</h2>
            </div>
            <p className="text-xs text-[#071313]/60 mt-0.5">
              Event-day operations view. Filter participants by race category, age bracket, and gender for podiums, timing, and kit distribution.
            </p>
          </div>

          {/* ACTIONS: BATCH MANAGEMENT, EXPORT CLEAN CSV & PRINT */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onOpenBatchModal}
              className="font-bold flex items-center gap-1.5 bg-[#071313] text-[#d9ff38] hover:bg-black/85"
            >
              <Layers className="h-3.5 w-3.5 text-[#d9ff38]" />
              Create / Assign Batches
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onExport}
              className="font-bold flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export Clean CSV ({stats.total || 0})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="font-bold flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Roster
            </Button>
          </div>
        </div>

        {/* FILTER CONTROLS */}
        <div className="space-y-3 pt-2 border-t border-black/5">
          {/* ROW 1: SEARCH & ROUTE & BATCH & GENDER & STATUS */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* SEARCH */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search name, ID, phone..."
                className="h-10 w-full rounded-xl border border-black/15 bg-white pl-9 pr-8 text-xs text-[#071313] placeholder:text-black/40 focus:border-[#071313] focus:outline-none"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* ROUTE DROPDOWN */}
            <select
              value={route}
              onChange={(e) => onRouteChange(e.target.value)}
              className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
            >
              <option value="all">All Ride Categories</option>
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* BATCH SELECT */}
            <select
              value={batch}
              onChange={(e) => onBatchChange(e.target.value)}
              className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
            >
              <option value="all">All Batches / Waves</option>
              <option value="unassigned">Unassigned (No Batch)</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* GENDER SELECT */}
            <select
              value={gender}
              onChange={(e) => onGenderChange(e.target.value)}
              className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
            >
              <option value="all">All Genders</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
              <option value="other">Other</option>
            </select>

            {/* ATTENDANCE / STATUS */}
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-10 rounded-xl border border-black/15 bg-white px-3 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
            >
              <option value="all">All Attendance</option>
              <option value="checked_in">Checked In Only</option>
              <option value="pending_checkin">Pending Arrival Only</option>
            </select>
          </div>

          {/* ROW 2: AGE BRACKET PILLS & CUSTOM RANGE */}
          <div className="pt-2">
            <label className="block text-[11px] font-black uppercase tracking-wider text-black/60 mb-1.5">
              Age Category Filter:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {AGE_BRACKETS.map((bracket) => (
                <button
                  key={bracket.id}
                  type="button"
                  onClick={() => onAgeBracketChange(bracket.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    ageBracket === bracket.id
                      ? "bg-[#071313] text-[#d9ff38] shadow-sm"
                      : "bg-black/5 text-[#071313]/70 hover:bg-black/10 hover:text-[#071313]"
                  }`}
                >
                  {bracket.label}
                </button>
              ))}
            </div>

            {/* CUSTOM AGE INPUTS (IF CUSTOM SELECTED) */}
            {ageBracket === "custom" && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-black/5 p-3 w-fit">
                <span className="text-xs font-bold text-[#071313]">Age From:</span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={minAge}
                  onChange={(e) => onMinAgeChange(e.target.value)}
                  placeholder="Min (e.g. 18)"
                  className="h-8 w-24 rounded-lg border border-black/15 bg-white px-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
                <span className="text-xs font-bold text-[#071313]">To:</span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={maxAge}
                  onChange={(e) => onMaxAgeChange(e.target.value)}
                  placeholder="Max (e.g. 35)"
                  className="h-8 w-24 rounded-lg border border-black/15 bg-white px-2.5 text-xs text-[#071313] focus:border-[#071313] focus:outline-none"
                />
                {(minAge || maxAge) && (
                  <button
                    type="button"
                    onClick={() => {
                      onMinAgeChange("");
                      onMaxAgeChange("");
                    }}
                    className="text-xs text-red-600 font-bold hover:underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* METRICS SUMMARY BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#071313]">
                Matching Riders: <span className="font-black text-base">{stats.total || 0}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Checked In: {stats.checkedIn || 0}
              </span>
              <span>•</span>
              <span className="text-amber-700 font-bold">
                Pending: {stats.pending || 0}
              </span>
              {stats.batched !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-purple-700 font-bold">
                    Batched: {stats.batched} | Unassigned: {stats.unbatched}
                  </span>
                </>
              )}
              {selectedRosterIds.length > 0 && (
                <>
                  <span>•</span>
                  <span className="rounded-md bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 font-bold">
                    {selectedRosterIds.length} Selected
                  </span>
                </>
              )}
              <span>•</span>
              <span className="text-black/60">
                Male: {stats.male || 0} | Female: {stats.female || 0}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-black/60">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 rounded-lg border border-black/15 bg-white px-2 text-xs font-bold text-[#071313]"
              >
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="500">500 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ROSTER TABLE (LIGHTWEIGHT, CLEAN, PRINT-OPTIMIZED) */}
      <div className="overflow-hidden rounded-2xl border border-[#071313]/10 bg-white shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/10 bg-[#071313] text-white print:bg-neutral-100 print:text-black">
                <th className="py-3 px-3 text-center w-10 print:hidden">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRiders.length > 0 &&
                      paginatedRiders.every((r) => selectedRosterIds.includes(r.id))
                    }
                    onChange={onToggleSelectAll}
                    className="accent-[#d9ff38] h-4 w-4 rounded cursor-pointer"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="py-3 px-3 font-mono font-black text-center w-16 text-[#d9ff38] print:text-black">ID</th>
                <th className="py-3 px-4 font-black">Rider Name</th>
                <th className="py-3 px-3 font-black text-center">Age / Gender</th>
                <th className="py-3 px-4 font-black">Route Category</th>
                <th className="py-3 px-3 font-black text-center">Batch / Wave</th>
                <th className="py-3 px-3 font-black text-center">Jersey</th>
                <th className="py-3 px-3 font-black">Contact</th>
                <th className="py-3 px-3 font-black">Emergency Contact</th>
                <th className="py-3 px-3 font-black">City / Org</th>
                <th className="py-3 px-3 font-black text-center">Check-In</th>
                <th className="py-3 px-3 font-black text-center w-16 print:hidden">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {paginatedRiders.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-black/50">
                    No riders match the selected route and age filters.
                  </td>
                </tr>
              ) : (
                paginatedRiders.map((rider, index) => {
                  const isCheckedIn = rider.status === "checked_in";
                  const isSelected = selectedRosterIds.includes(rider.id);
                  return (
                    <tr
                      key={rider.id}
                      onClick={(e) => {
                        if (
                          e.target.tagName === "INPUT" ||
                          e.target.tagName === "BUTTON" ||
                          e.target.tagName === "A" ||
                          e.target.closest("button") ||
                          e.target.closest("a")
                        ) {
                          return;
                        }
                        onToggleSelectRider(rider.id);
                      }}
                      className={`transition cursor-pointer hover:bg-black/[0.02] ${
                        isSelected
                          ? "bg-purple-50/70"
                          : index % 2 === 1
                          ? "bg-black/[0.01]"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectRider(rider.id)}
                          className="accent-[#071313] h-4 w-4 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-black">
                        #{rider.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-black text-sm text-[#071313]">{rider.full_name}</div>
                        <div className="text-[11px] text-black/50 truncate max-w-[180px]">{rider.email}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded-md bg-black/5 px-2 py-0.5 font-bold text-[#071313]">
                          {rider.age ? `${rider.age} yrs` : "—"}
                        </span>
                        <div className="text-[10px] font-semibold text-black/50 mt-0.5 capitalize">
                          {rider.gender || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#071313]">
                        {rider.ride_category}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rider.batch_name ? (
                          <span className="inline-block rounded-md bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 font-black text-[11px] tracking-tight">
                            {rider.batch_name}
                          </span>
                        ) : (
                          <span className="text-black/30 font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded-md border border-black/15 bg-white px-2 py-0.5 font-bold text-[#071313]">
                          {rider.t_shirt_size || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={`tel:${rider.phone}`}
                          className="font-mono font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {rider.phone}
                        </a>
                      </td>
                      <td className="py-3 px-3">
                        {rider.emergency_contact ? (
                          <a
                            href={`tel:${rider.emergency_contact}`}
                            className="font-mono text-black/70 hover:underline text-[11px]"
                          >
                            {rider.emergency_contact}
                          </a>
                        ) : (
                          <span className="text-black/30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#071313]">{rider.city || "—"}</div>
                        {rider.organization_name && (
                          <div className="text-[10px] text-black/50 truncate max-w-[140px]">
                            {rider.organization_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                            <CheckCircle2 className="h-3 w-3" /> Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onShowQr(rider)}
                          className="p-1 rounded-lg hover:bg-black/10 text-black/70 hover:text-black transition"
                          title="View Check-In QR Pass"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ROSTER PAGINATION BAR */}
        {riders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-black/10 bg-[#fbf8ef] text-xs print:hidden">
            <span className="text-black/60 font-semibold">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, riders.length)} of{" "}
              {riders.length} riders
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className="h-8 font-bold"
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>
              <span className="px-2 font-mono font-bold text-black/70">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                className="h-8 font-bold"
              >
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
