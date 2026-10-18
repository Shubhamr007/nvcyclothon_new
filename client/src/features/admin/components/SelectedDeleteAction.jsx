import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

export function SelectedDeleteAction({ count, label = "item", busy = false, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!count) return null;

  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
        <span className="text-xs font-bold text-red-900">
          {count} {label}{count === 1 ? "" : "s"} selected
        </span>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
          className="h-8 bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete selected
        </Button>
      </div>

      <ConfirmDeleteDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          try {
            await onDelete();
          } catch (err) {
            console.error("Delete action failed:", err);
          }
        }}
        title={`Delete Selected ${capitalizedLabel}s`}
        description={`Are you sure you want to permanently delete the ${count} selected ${label}${count === 1 ? "" : "s"}? This action cannot be undone.`}
        count={count}
        isDeleting={busy}
      />
    </>
  );
}

export default SelectedDeleteAction;