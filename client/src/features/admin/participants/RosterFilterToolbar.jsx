import React, { memo, useCallback } from "react";
import {
  Award,
  Layers,
  Download,
  Printer,
  Search,
  X,
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

export const AgeBracketPill = memo(function AgeBracketPill({
  bracket,
  isSelected,
  onSelect,
}) {
  const handleClick = useCallback(() => {
    onSelect(bracket.id);
  }, [bracket.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        isSelected
          ? "bg-slate-900 text-white shadow-xs"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {bracket.label}
    </button>
  );
});

export const RosterFilterToolbar = memo(function RosterFilterToolbar({
  routes = [],
  batches = [],
  searchText = "",
  onSearchChange,
  route = "all",
  onRouteChange,
  batch = "all",
  onBatchChange,
  gender = "all",
  onGenderChange,
  status = "all",
  onStatusChange,
  ageBracket = "all",
  onAgeBracketChange,
  minAge = "",
  onMinAgeChange,
  maxAge = "",
  onMaxAgeChange,
  totalRiders = 0,
  onOpenBatchModal,
  onExport,
  onPrint,
}) {
  const handleClearAge = useCallback(() => {
    onMinAgeChange("");
    onMaxAgeChange("");
  }, [onMinAgeChange, onMaxAgeChange]);

  return (
    <div className="space-y-4">
      {/* HEADER ROW WITH ACTION BUTTONS */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Race Category & Age Roster</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
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
            className="font-medium flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 h-8"
          >
            <Layers className="h-3.5 w-3.5" />
            Create / Assign Batches
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onExport}
            className="font-medium flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 h-8"
          >
            <Download className="h-3.5 w-3.5" />
            Export Clean CSV ({totalRiders})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="font-medium flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 h-8"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Roster
          </Button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        {/* ROW 1: SEARCH & ROUTE & BATCH & GENDER & STATUS */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, ID, phone..."
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* ROUTE DROPDOWN */}
          <select
            value={route}
            onChange={(e) => onRouteChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Attendance</option>
            <option value="checked_in">Checked In Only</option>
            <option value="pending_checkin">Pending Arrival Only</option>
          </select>
        </div>

        {/* ROW 2: AGE BRACKET PILLS & CUSTOM RANGE */}
        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
            Age Category Filter:
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {AGE_BRACKETS.map((bracket) => (
              <AgeBracketPill
                key={bracket.id}
                bracket={bracket}
                isSelected={ageBracket === bracket.id}
                onSelect={onAgeBracketChange}
              />
            ))}
          </div>

          {/* CUSTOM AGE INPUTS (IF CUSTOM SELECTED) */}
          {ageBracket === "custom" && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-slate-100 p-2.5 w-fit border border-slate-200">
              <span className="text-xs font-medium text-slate-700">Age From:</span>
              <input
                type="number"
                min="5"
                max="100"
                value={minAge}
                onChange={(e) => onMinAgeChange(e.target.value)}
                placeholder="Min (e.g. 18)"
                className="h-7 w-20 rounded border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
              <span className="text-xs font-medium text-slate-700">To:</span>
              <input
                type="number"
                min="5"
                max="100"
                value={maxAge}
                onChange={(e) => onMaxAgeChange(e.target.value)}
                placeholder="Max (e.g. 35)"
                className="h-7 w-20 rounded border border-slate-300 bg-white px-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
              {(minAge || maxAge) && (
                <button
                  type="button"
                  onClick={handleClearAge}
                  className="text-xs text-red-600 font-medium hover:underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default RosterFilterToolbar;
