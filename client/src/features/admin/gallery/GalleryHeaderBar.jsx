import React, { memo } from "react";
import { Button } from "../../../components/ui/button";
import { Upload, Plus } from "lucide-react";

export const GalleryHeaderBar = memo(function GalleryHeaderBar({
  totalCount = 0,
  onOpenBatchUpload,
  onOpenAddSingle,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Photo Gallery Manager</h2>
          <span className="rounded-full bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 text-xs font-bold text-[#005a9e]">
            {totalCount} Photos
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage media streams showcased in the official cyclothon landing page gallery section.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          onClick={onOpenBatchUpload}
          className="flex items-center gap-2 bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition"
        >
          <Upload className="h-4 w-4 text-white" />
          <span>Upload Multiple Photos</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onOpenAddSingle}
          className="flex items-center gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold px-3 py-2 rounded-xl transition"
        >
          <Plus className="h-4 w-4 text-slate-600" />
          <span>Add Single Photo</span>
        </Button>
      </div>
    </div>
  );
});
