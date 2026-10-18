import React from "react";
import { Search, Plus, Edit2, Trash2, CheckSquare, X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function MemberToolbar({
  searchQuery,
  onSearchChange,
  visibilityFilter,
  onFilterChange,
  totalCount,
  visibleCount,
  hiddenCount,
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
            placeholder="Search by name, role, or statement…"
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
          {/* Dynamic Selection Action Buttons */}
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
              {/* Edit button: only visible when EXACTLY ONE member is selected */}
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

              {/* Delete button: allows single or bulk deletion */}
              <Button
                type="button"
                onClick={onDeleteSelected}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition h-10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete ({selectedCount})</span>
              </Button>

              {/* Clear selection button */}
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
            /* Primary Add Member Button */
            <Button
              type="button"
              onClick={onAddClick}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition h-10"
            >
              <Plus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Summary Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              visibilityFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Members ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("visible")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              visibilityFilter === "visible"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Live on Website ({visibleCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("hidden")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              visibilityFilter === "hidden"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Hidden ({hiddenCount})
          </button>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
            <CheckSquare className="h-3.5 w-3.5 text-slate-900" />
            <span>{selectedCount} of {totalCount} selected</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberToolbar;
