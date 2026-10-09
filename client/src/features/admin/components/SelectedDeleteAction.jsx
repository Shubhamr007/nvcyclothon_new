import { Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function SelectedDeleteAction({ count, label, busy = false, onDelete }) {
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
      <span className="text-xs font-bold text-red-900">
        {count} {label}{count === 1 ? "" : "s"} selected
      </span>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => {
          const noun = count === 1 ? label : `${label}s`;
          if (window.confirm(`Permanently delete ${count} selected ${noun}? This cannot be undone.`)) {
            void Promise.resolve(onDelete()).catch(() => {});
          }
        }}
        className="h-8 bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete selected
      </Button>
    </div>
  );
}