import React from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function EarlyBirdConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  targetState,
  quota = 50,
}) {
  if (!isOpen) return null;

  const isDisabling = !targetState;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-bird-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                isDisabling
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-300"
              }`}
            >
              {isDisabling ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3
                id="early-bird-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {isDisabling
                  ? "Disable Early Bird Pricing?"
                  : "Enable Early Bird Pricing?"}
              </h3>
              <p className="text-xs text-slate-500">
                {isDisabling
                  ? "Switch to standard regular registration fees"
                  : `Activate discounted pricing up to ${quota} riders`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Impact Explanation */}
        <div
          className={`rounded-xl p-3.5 text-xs leading-relaxed border ${
            isDisabling
              ? "bg-amber-50 text-amber-900 border-amber-200"
              : "bg-emerald-50 text-emerald-900 border-emerald-200"
          }`}
        >
          {isDisabling ? (
            <p>
              <strong>Impact:</strong> Disabling Early Bird pricing will immediately
              charge regular prices for all new registrations across all race
              categories. <strong>Existing registered riders are not affected</strong> and
              their payments will not be modified.
            </p>
          ) : (
            <p>
              <strong>Impact:</strong> Enabling Early Bird pricing allows new
              registrations to receive discounted tier rates until the active
              quota of <strong>{quota} riders</strong> is filled.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl text-xs font-bold text-white h-9 shadow-sm ${
              isDisabling
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isDisabling ? "Disable Early Bird" : "Enable Early Bird"}
          </Button>
        </div>
      </div>
    </div>
  );
}
