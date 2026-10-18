import React, { useCallback } from "react";
import { Search, Plus, Edit2, Trash2, CheckSquare, X, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";

const STATUS_FILTERS = [
  { id: "all", label: "All Status" },
  { id: "confirmed", label: "Confirmed" },
  { id: "invited", label: "Invited" },
  { id: "attended", label: "Attended" },
  { id: "declined", label: "Declined" },
];

const StatusFilterButton = React.memo(function StatusFilterButton({
  status,
  isSelected,
  onSelect,
}) {
  const handleClick = useCallback(() => {
    onSelect(status.id);
  }, [status.id, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
        isSelected
          ? "bg-slate-200 text-slate-900 font-bold"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      {status.label}
    </button>
  );
});

export function DelegationToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  totalCount,
  chiefGuestCount,
  delegationCount,
  selectedCount,
  onAddClick,
  onEditSelected,
  onDeleteSelected,
  onClearSelection,
}) {
  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Selection Actions, and Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by VIP name, organization, ceremony role, notes…"
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              {selectedCount === 1 && onEditSelected && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onEditSelected}
                  className="flex items-center gap-1.5 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition h-10"
                >
                  <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Edit</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition h-10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedCount})</span>
              </Button>

              <button
                type="button"
                onClick={onClearSelection}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors"
                title="Deselect all rows"
              >
                Clear
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition h-10"
            >
              <Plus className="h-4 w-4" />
              <span>Add VIP / Delegation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row: Type Filters & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 text-xs">
        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilterTypeChange("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filterType === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Records ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterTypeChange("chief_guests")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filterType === "chief_guests"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Chief Guests & VIPs ({chiefGuestCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterTypeChange("delegations")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              filterType === "delegations"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Corporate Delegations ({delegationCount})
          </button>
        </div>

        {/* Status Dropdown/Pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
          {STATUS_FILTERS.map((s) => (
            <StatusFilterButton
              key={s.id}
              status={s}
              isSelected={filterStatus === s.id}
              onSelect={onFilterStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DelegationToolbar;
