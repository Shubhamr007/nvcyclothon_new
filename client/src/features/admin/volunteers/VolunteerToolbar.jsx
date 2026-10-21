import React from "react";
import { Search, Plus, Trash2, Download, Upload, Loader2, X, Filter } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ROLE_OPTIONS } from "../../../store/slices/volunteersSlice";

export function VolunteerToolbar({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  activeCount,
  disabledCount,
  selectedCount,
  onAddClick,
  onBulkClick,
  onDownloadTemplate,
  downloadingTemplate = false,
  onDeleteSelected,
  onClearSelection,
}) {
  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Bulk Actions, Template, and Drawer Triggers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search volunteers by name, email, ID, or phone…"
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] shadow-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
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
              >
                Clear
              </button>
            </div>
          ) : (
            <>
              {/* Download CSV Template */}
              <Button
                type="button"
                variant="outline"
                disabled={downloadingTemplate}
                onClick={onDownloadTemplate}
                className="flex items-center gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition h-10"
              >
                {downloadingTemplate ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Excel Template</span>
              </Button>

              {/* Bulk Import Drawer */}
              <Button
                type="button"
                variant="outline"
                onClick={onBulkClick}
                className="flex items-center gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition h-10"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import CSV</span>
              </Button>

              {/* Add Volunteer Drawer */}
              <Button
                type="button"
                onClick={onAddClick}
                className="flex items-center gap-2 bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition h-10"
              >
                <Plus className="h-4 w-4" />
                <span>Add Volunteer</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Row: Role selector & Status tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200 text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              statusFilter === "all"
                ? "bg-[#0078d4] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Volunteers ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("active")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              statusFilter === "active"
                ? "bg-[#0078d4] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("disabled")}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              statusFilter === "disabled"
                ? "bg-[#0078d4] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Disabled ({disabledCount})
          </button>
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          >
            <option value="all">All Assigned Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default VolunteerToolbar;
