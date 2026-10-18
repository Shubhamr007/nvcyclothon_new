import React from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";

export function GalleryBatchDrawer({
  isOpen,
  onClose,
  batchCategory,
  setBatchCategory,
  batchBaseTitle,
  setBatchBaseTitle,
  batchFiles,
  setBatchFiles,
  batchUploading,
  batchProgress,
  onSubmit,
}) {
  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !batchUploading && onClose()}
      side="right"
      title="Upload Multiple Photographs"
      subtitle="Batch upload photos into public website category streams"
      icon={Upload}
      width="max-w-xl"
      footer={
        <div className="flex w-full items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={batchUploading}
            onClick={onClose}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={batchUploading || batchFiles.length === 0}
            onClick={onSubmit}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4"
          >
            {batchUploading
              ? `Uploading (${batchProgress.current}/${batchProgress.total})…`
              : `Upload ${batchFiles.length} Photos`}
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Assign Category Tab:
          </label>
          <select
            value={batchCategory}
            onChange={(e) => setBatchCategory(e.target.value)}
            disabled={batchUploading}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="Organizers">Organizers & Race Directors</option>
            <option value="Partners">Official Partners & Sponsors</option>
            <option value="Riders">Riders & Peloton Moments</option>
            <option value="Highlights">Route & Event Highlights</option>
            <option value="Event">General Event Photography</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Common Title Prefix (optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Rewa Route Highlights"
            value={batchBaseTitle}
            onChange={(e) => setBatchBaseTitle(e.target.value)}
            disabled={batchUploading}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Leave blank to auto-generate titles from each photo's file name.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Photos (Multiple Files Allowed):
          </label>
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-6 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-100/80 transition-colors">
            <ImageIcon className="h-8 w-8 text-slate-500" />
            <span className="text-xs font-semibold text-slate-800">
              {batchFiles.length > 0
                ? `${batchFiles.length} photos selected`
                : "Click to select or drag and drop multiple pictures"}
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={batchUploading}
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setBatchFiles(Array.from(e.target.files));
                }
              }}
            />
          </label>
        </div>

        {batchFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
              <span>Selected Images ({batchFiles.length})</span>
              <button
                type="button"
                onClick={() => setBatchFiles([])}
                className="text-[11px] text-rose-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            {batchFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200 text-slate-700"
              >
                <span className="truncate max-w-[340px] font-mono text-[11px]">{f.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {Math.round(f.size / 1024)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </form>
    </AdminSlideOver>
  );
}

export default GalleryBatchDrawer;
