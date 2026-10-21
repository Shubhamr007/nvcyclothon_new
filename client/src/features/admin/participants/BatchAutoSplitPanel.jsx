import React, { memo } from "react";

export const BatchAutoSplitPanel = memo(function BatchAutoSplitPanel({
  batchSize,
  setBatchSize,
  batchPrefix,
  setBatchPrefix,
  startNumber,
  setStartNumber,
  previewBatches = [],
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Riders Per Batch
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={batchSize}
            onChange={(e) => setBatchSize(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Batch Prefix
          </label>
          <input
            type="text"
            value={batchPrefix}
            onChange={(e) => setBatchPrefix(e.target.value)}
            placeholder="Batch, Wave, Corral"
            className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Starting Number
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={startNumber}
            onChange={(e) => setStartNumber(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Preview Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span>Generated Waves Preview</span>
          <span className="text-slate-500">{previewBatches.length} Batches Total</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
          {previewBatches.map((b, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800"
            >
              <span className="text-[#0078d4] font-bold">{b.name}</span>
              <span className="text-slate-500 font-mono">({b.count} riders)</span>
            </span>
          ))}
          {previewBatches.length === 0 && (
            <span className="text-xs text-slate-400">No riders to batch</span>
          )}
        </div>
      </div>
    </div>
  );
});
