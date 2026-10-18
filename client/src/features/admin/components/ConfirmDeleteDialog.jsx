import React from "react";
import { AlertCircle, Trash2, Loader2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";

/**
 * Reusable Confirmation Dialog for single or bulk deletion actions.
 * Designed to be shared across MembersTab, DelegationsTab, VolunteersTab, GalleryManager, etc.
 */
export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete the selected item(s)? This action cannot be undone.",
  count = 1,
  itemNames = [],
  isDeleting = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertCircle className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 id="confirm-delete-title" className="text-base font-bold text-slate-900">
              {title}
            </h3>
            {count > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                {count} {count === 1 ? "record" : "records"}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            {description}
          </p>

          {itemNames && itemNames.length > 0 && (
            <div className="mt-3 max-h-28 overflow-y-auto rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs text-slate-700 space-y-1">
              {itemNames.slice(0, 5).map((name, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate font-medium">{name}</span>
                </div>
              ))}
              {itemNames.length > 5 && (
                <p className="text-[11px] text-slate-400 italic pt-1">
                  + {itemNames.length - 5} more items selected
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl h-10 px-5 flex items-center gap-2 shadow-sm transition"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete {count > 1 ? `(${count})` : "Record"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteDialog;
