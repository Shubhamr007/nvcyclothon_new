import React, { memo } from "react";
import { RosterFilterToolbar, AGE_BRACKETS, AgeBracketPill } from "./RosterFilterToolbar";
import { RosterStatsSummary } from "./RosterStatsSummary";
import { RosterTable } from "./RosterTable";

export { AGE_BRACKETS, AgeBracketPill } from "./RosterFilterToolbar";

/**
 * Event-Day Race Roster coordinator component.
 * Modularized into RosterFilterToolbar, RosterStatsSummary, and RosterTable subcomponents.
 */
export const EventDayRaceRoster = memo(function EventDayRaceRoster({
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
      {/* ROSTER CONFIGURATION & FILTER CONTROL PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 print:hidden">
        <RosterFilterToolbar
          routes={routes}
          batches={batches}
          searchText={searchText}
          onSearchChange={onSearchChange}
          route={route}
          onRouteChange={onRouteChange}
          batch={batch}
          onBatchChange={onBatchChange}
          gender={gender}
          onGenderChange={onGenderChange}
          status={status}
          onStatusChange={onStatusChange}
          ageBracket={ageBracket}
          onAgeBracketChange={onAgeBracketChange}
          minAge={minAge}
          onMinAgeChange={onMinAgeChange}
          maxAge={maxAge}
          onMaxAgeChange={onMaxAgeChange}
          totalRiders={stats.total || 0}
          onOpenBatchModal={onOpenBatchModal}
          onExport={onExport}
          onPrint={onPrint}
        />

        {/* METRICS SUMMARY BAR & PAGE SIZE SELECTOR */}
        <RosterStatsSummary
          stats={stats}
          selectedCount={selectedRosterIds.length}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
        />
      </div>

      {/* ROSTER TABLE & PAGINATION CONTROLS */}
      <RosterTable
        riders={riders}
        paginatedRiders={paginatedRiders}
        selectedRosterIds={selectedRosterIds}
        onToggleSelectRider={onToggleSelectRider}
        onToggleSelectAll={onToggleSelectAll}
        onShowQr={onShowQr}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
});

export default EventDayRaceRoster;
