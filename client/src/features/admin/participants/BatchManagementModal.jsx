import React, { useState, useMemo } from "react";
import { Layers, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function BatchManagementModal({
  isOpen,
  onClose,
  filteredRiders = [],
  selectedRiders = [],
  existingBatches = [],
  onAssignBatch,
  isSaving = false,
}) {
  const [scope, setScope] = useState("filtered"); // "filtered" | "selected"
  const [mode, setMode] = useState("auto_split"); // "auto_split" | "custom" | "clear"
  const [batchSize, setBatchSize] = useState(50);
  const [batchPrefix, setBatchPrefix] = useState("Batch");
  const [startNumber, setStartNumber] = useState(1);
  const [customName, setCustomName] = useState("");

  if (!isOpen) return null;

  const targetRiders =
    scope === "selected" && selectedRiders.length > 0 ? selectedRiders : filteredRiders;
  const count = targetRiders.length;

  // Auto-split preview calculation
  const previewBatches = useMemo(() => {
    if (count === 0 || !batchSize || batchSize < 1) return [];
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
  }, [count, batchSize, batchPrefix, startNumber]);

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
        alert("Please enter a batch name.");
        return;
      }
      onAssignBatch({
        mode: "custom",
        targetRiders,
        batchName: customName.trim(),
      });
    } else if (mode === "clear") {
      if (
        window.confirm(
          `Are you sure you want to remove batch assignments for ${count} riders?`
        )
      ) {
        onAssignBatch({
          mode: "clear",
          targetRiders,
          batchName: null,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/10 bg-[#071313] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-[#d9ff38]" />
            <div>
              <h3 className="text-base font-black tracking-wide">
                Race Batch & Wave Management
              </h3>
              <p className="text-[11px] text-white/70">
                Group & schedule riders by category & age for event-day start waves
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Audience Selector */}
          <div className="rounded-xl border border-black/10 bg-[#fbf8ef] p-3.5 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-black/60">
              Target Participants ({count} Total)
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#071313]">
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                  className="accent-[#071313]"
                />
                All {filteredRiders.length} Filtered Riders
              </label>
              {selectedRiders.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#071313]">
                  <input
                    type="radio"
                    name="scope"
                    value="selected"
                    checked={scope === "selected"}
                    onChange={() => setScope("selected")}
                    className="accent-[#071313]"
                  />
                  Selected ({selectedRiders.length}) Riders Only
                </label>
              )}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-black/5 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("auto_split")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "auto_split"
                  ? "bg-white text-[#071313] shadow-sm font-black"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Auto-Split (Waves)
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "custom"
                  ? "bg-white text-[#071313] shadow-sm font-black"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Single Batch Name
            </button>
            <button
              type="button"
              onClick={() => setMode("clear")}
              className={`flex-1 rounded-lg py-2 transition text-center ${
                mode === "clear"
                  ? "bg-red-50 text-red-700 shadow-sm font-black"
                  : "text-black/60 hover:text-black"
              }`}
            >
              Clear Batch
            </button>
          </div>

          {/* Mode 1: Auto-Split */}
          {mode === "auto_split" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-black/70 mb-1">
                    Riders Per Batch
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    className="h-9 w-full rounded-lg border border-black/15 px-3 text-xs font-bold focus:border-[#071313] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70 mb-1">
                    Batch Prefix
                  </label>
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="Batch, Wave, Corral"
                    className="h-9 w-full rounded-lg border border-black/15 px-3 text-xs font-bold focus:border-[#071313] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-black/70 mb-1">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    className="h-9 w-full rounded-lg border border-black/15 px-3 text-xs font-bold focus:border-[#071313] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="rounded-xl border border-black/10 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#071313]">
                  <span>Generated Waves Preview</span>
                  <span className="text-black/50">{previewBatches.length} Batches Total</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                  {previewBatches.map((b, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-black/10 px-2.5 py-1 text-[11px] font-bold text-[#071313]"
                    >
                      <span className="text-purple-700">{b.name}</span>
                      <span className="text-black/40 font-mono">({b.count} riders)</span>
                    </span>
                  ))}
                  {previewBatches.length === 0 && (
                    <span className="text-xs text-black/40">No riders to batch</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Custom Name */}
          {mode === "custom" && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-black/70 mb-1">
                  Assign Batch Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Wave 1 - 06:00 AM, Elite Corral, etc."
                  maxLength={64}
                  className="h-10 w-full rounded-lg border border-black/15 px-3 text-xs font-bold focus:border-[#071313] focus:outline-none"
                  required
                />
              </div>

              {/* Existing Batches Quick Pick */}
              {existingBatches.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-black/50 mb-1.5">
                    Quick Pick From Existing Batches:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {existingBatches.map((batch) => (
                      <button
                        key={batch}
                        type="button"
                        onClick={() => setCustomName(batch)}
                        className="rounded-lg bg-black/5 hover:bg-black/10 px-2.5 py-1 text-[11px] font-bold text-[#071313] transition"
                      >
                        {batch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Clear Batch */}
          {mode === "clear" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs space-y-1 text-red-900">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Reset Batch Assignment
              </div>
              <p className="text-red-700/80">
                This will remove the assigned batch from all {count} target riders. Their batch status will become "Unassigned".
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === "clear" ? "destructive" : "default"}
              size="sm"
              disabled={isSaving || count === 0}
              className="font-bold min-w-[120px]"
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
