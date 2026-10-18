import React, { useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { Layers, X, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { BatchAutoSplitPanel } from "./BatchAutoSplitPanel";
import { BatchCustomPanel, BatchQuickPickButton } from "./BatchCustomPanel";
import { BatchClearPanel } from "./BatchClearPanel";

export { BatchQuickPickButton };

export function BatchManagementModal({
  isOpen,
  onClose,
  filteredRiders = [],
  selectedRiders = [],
  existingBatches = [],
  onAssignBatch,
  isSaving = false,
}) {
  const [form, setForm] = useState({
    scope: "filtered",
    mode: "auto_split",
    batchSize: 50,
    batchPrefix: "Batch",
    startNumber: 1,
    customName: "",
  });

  const { scope, mode, batchSize, batchPrefix, startNumber, customName } = form;

  const [confirmClear, setConfirmClear] = useState(false);

  const setScope = useCallback(
    (val) => setForm((p) => ({ ...p, scope: val })),
    []
  );
  const setMode = useCallback(
    (val) => {
      setForm((p) => ({ ...p, mode: val }));
      setConfirmClear(false);
    },
    []
  );
  const setBatchSize = useCallback(
    (val) => setForm((p) => ({ ...p, batchSize: val })),
    []
  );
  const setBatchPrefix = useCallback(
    (val) => setForm((p) => ({ ...p, batchPrefix: val })),
    []
  );
  const setStartNumber = useCallback(
    (val) => setForm((p) => ({ ...p, startNumber: val })),
    []
  );
  const setCustomName = useCallback(
    (val) => setForm((p) => ({ ...p, customName: val })),
    []
  );

  const targetRiders =
    scope === "selected" && selectedRiders.length > 0 ? selectedRiders : filteredRiders;
  const count = targetRiders.length;

  // Auto-split preview calculation
  const previewBatches = useMemo(() => {
    if (!isOpen || count === 0 || !batchSize || batchSize < 1) return [];
    const size = Math.max(1, Number(batchSize) || 50);
    const start = Math.max(1, Number(startNumber) || 1);
    const prefix = (batchPrefix || "Batch").trim();
    const batches = [];
    let riderIndex = 0;
    let bNum = start;
    while (riderIndex < count) {
      const take = Math.min(size, count - riderIndex);
      batches.push({
        name: `${prefix} ${bNum}`,
        count: take,
        range: `${riderIndex + 1}–${riderIndex + take}`,
      });
      riderIndex += take;
      bNum += 1;
    }
    return batches;
  }, [isOpen, count, batchSize, batchPrefix, startNumber]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (count === 0) return;
    if (mode === "auto_split") {
      onAssignBatch({
        mode: "auto_split",
        targetRiders,
        batchSize: Math.max(1, Number(batchSize) || 50),
        batchPrefix: (batchPrefix || "Batch").trim(),
        startNumber: Math.max(1, Number(startNumber) || 1),
      });
    } else if (mode === "custom") {
      if (!customName.trim()) {
        toast.error("Please enter a batch name.");
        return;
      }
      onAssignBatch({
        mode: "custom",
        targetRiders,
        batchName: customName.trim(),
      });
    } else if (mode === "clear") {
      if (!confirmClear) {
        toast.warn(`Please check the confirmation box to reset batch assignments for ${count} riders.`);
        return;
      }
      onAssignBatch({
        mode: "clear",
        targetRiders,
        batchName: null,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold tracking-wide">
                Race Batch & Wave Management
              </h3>
              <p className="text-[11px] text-slate-400">
                Group & schedule riders by category & age for event-day start waves
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Audience Selector */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target Participants ({count} Total)
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                  className="accent-slate-900"
                />
                All {filteredRiders.length} Filtered Riders
              </label>
              {selectedRiders.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="scope"
                    value="selected"
                    checked={scope === "selected"}
                    onChange={() => setScope("selected")}
                    className="accent-slate-900"
                  />
                  Selected ({selectedRiders.length}) Riders Only
                </label>
              )}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("auto_split")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "auto_split"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Auto-Split (Waves)
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "custom"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Single Batch Name
            </button>
            <button
              type="button"
              onClick={() => setMode("clear")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "clear"
                  ? "bg-rose-50 text-rose-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Clear Batch
            </button>
          </div>

          {/* Mode 1: Auto-Split */}
          {mode === "auto_split" && (
            <BatchAutoSplitPanel
              batchSize={batchSize}
              setBatchSize={setBatchSize}
              batchPrefix={batchPrefix}
              setBatchPrefix={setBatchPrefix}
              startNumber={startNumber}
              setStartNumber={setStartNumber}
              previewBatches={previewBatches}
            />
          )}

          {/* Mode 2: Custom Name */}
          {mode === "custom" && (
            <BatchCustomPanel
              customName={customName}
              setCustomName={setCustomName}
              existingBatches={existingBatches}
            />
          )}

          {/* Mode 3: Clear Batch */}
          {mode === "clear" && (
            <BatchClearPanel
              count={count}
              confirmClear={confirmClear}
              setConfirmClear={setConfirmClear}
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === "clear" ? "destructive" : "default"}
              size="sm"
              disabled={isSaving || count === 0 || (mode === "clear" && !confirmClear)}
              className={`font-semibold min-w-[120px] ${
                mode === "clear" ? "" : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                </span>
              ) : mode === "clear" ? (
                `Clear ${count} Riders`
              ) : mode === "auto_split" ? (
                `Create ${previewBatches.length} Batches`
              ) : (
                `Assign to ${count} Riders`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BatchManagementModal;
