import React, { memo } from "react";
import { Button } from "../../../components/ui/button";
import { Download, Plus } from "lucide-react";

export const VendorHeaderBar = memo(function VendorHeaderBar({
  subTab = "applications",
  applicationsCount = 0,
  allocationsCount = 0,
  onSubTabChange,
  onExportCsv,
  onAdd,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Vendor & Expo Stall Management</h2>
        <p className="text-xs text-slate-500">
          Review food stalls, bicycle equipment, recovery gear, and utility allocations.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => onSubTabChange?.("applications")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              subTab === "applications"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Applications ({applicationsCount})
          </button>
          <button
            type="button"
            onClick={() => onSubTabChange?.("allocations")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              subTab === "allocations"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Stall Allocations ({allocationsCount})
          </button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onExportCsv}
          className="h-8 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>
        <Button size="sm" onClick={onAdd} className="h-8 bg-[#0078d4] text-xs text-white hover:bg-[#106ebe]">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add vendor
        </Button>
      </div>
    </div>
  );
});
