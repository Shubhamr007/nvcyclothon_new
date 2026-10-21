import React, { memo, useCallback } from "react";

export const BatchQuickPickButton = memo(function BatchQuickPickButton({
  batch,
  onSelect,
}) {
  const handleClick = useCallback(() => {
    onSelect?.(batch);
  }, [batch, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-800 transition"
    >
      {batch}
    </button>
  );
});

export const BatchCustomPanel = memo(function BatchCustomPanel({
  customName = "",
  setCustomName,
  existingBatches = [],
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
          Assign Batch Name
        </label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName?.(e.target.value)}
          placeholder="e.g. Wave 1 - 06:00 AM, Elite Corral, etc."
          maxLength={64}
          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#0078d4] focus:outline-none"
          required
        />
      </div>

      {/* Existing Batches Quick Pick */}
      {existingBatches.length > 0 && (
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
            Quick Pick From Existing Batches:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {existingBatches.map((batch) => (
              <BatchQuickPickButton
                key={batch}
                batch={batch}
                onSelect={setCustomName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
