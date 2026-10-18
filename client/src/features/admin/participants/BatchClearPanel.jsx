import React, { memo } from "react";
import { AlertCircle } from "lucide-react";

export const BatchClearPanel = memo(function BatchClearPanel({
  count = 0,
  confirmClear = false,
  setConfirmClear,
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs space-y-3 text-rose-900">
      <div className="font-bold flex items-center gap-1.5 text-rose-700">
        <AlertCircle className="h-4 w-4 text-rose-600" />
        Reset Batch Assignment
      </div>
      <p className="text-rose-700/90 leading-relaxed">
        This will remove the assigned batch from all <span className="font-bold text-rose-950">{count}</span> target riders. Their batch status will become "Unassigned".
      </p>
      <label className="flex items-center gap-2 font-medium text-rose-900 cursor-pointer pt-2 border-t border-rose-200/80">
        <input
          type="checkbox"
          checked={confirmClear}
          onChange={(e) => setConfirmClear?.(e.target.checked)}
          className="h-4 w-4 rounded accent-rose-600 border-rose-300 cursor-pointer"
        />
        <span>I understand and confirm resetting batches for {count} rider{count === 1 ? "" : "s"}.</span>
      </label>
    </div>
  );
});
