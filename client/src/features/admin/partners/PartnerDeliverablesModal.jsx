import React from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

const PartnerDeliverableRow = React.memo(function PartnerDeliverableRow({
  item,
  disabled,
  onToggle,
}) {
  const handleClick = React.useCallback(() => {
    onToggle(item.id, item.status);
  }, [item.id, item.status, onToggle]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5">
      <div>
        <p className="font-semibold text-xs text-slate-900">{item.deliverable_type}</p>
        {item.completed_at && (
          <p className="text-[10px] text-emerald-600 font-medium">
            Completed on {new Date(item.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant={item.status === "COMPLETED" ? "default" : "outline"}
        disabled={disabled}
        onClick={handleClick}
        className={`h-7 text-xs font-medium ${
          item.status === "COMPLETED"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {item.status === "COMPLETED" ? "✓ Done" : "Mark Done"}
      </Button>
    </div>
  );
});

export function PartnerDeliverablesModal({
  deliverablesApp,
  onClose,
  deliverables,
  updatingDeliverable,
  onToggleDeliverable,
}) {
  if (!deliverablesApp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-[#005a9e]">Deliverable Tracking</span>
            <h4 className="text-lg font-bold text-slate-900">
              {deliverablesApp.company_name}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {deliverables.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No specific deliverables logged yet.</p>
          ) : (
            deliverables.map((item) => (
              <PartnerDeliverableRow
                key={item.id}
                item={item}
                disabled={updatingDeliverable}
                onToggle={onToggleDeliverable}
              />
            ))
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-right">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PartnerDeliverablesModal;
