import React, { useCallback, memo } from "react";
import { Button } from "../../../components/ui/button";
import { Edit2 } from "lucide-react";

export const ManagePanelRow = memo(function ManagePanelRow({
  item,
  selected,
  onToggleSelect,
  onEdit,
  render,
  title,
}) {
  const handleToggle = useCallback(() => {
    onToggleSelect?.(item.id);
  }, [item.id, onToggleSelect]);

  const handleEdit = useCallback(() => {
    onEdit?.(item);
  }, [item, onEdit]);

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-[#0078d4]/40 transition-colors">
      <div className="flex items-center gap-3">{render(item)}</div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleToggle}
          className="h-4 w-4 rounded accent-[#0078d4] border-slate-300"
          aria-label={`Select ${title} record`}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleEdit}
          className="h-8 px-2.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0078d4]"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </article>
  );
});

export default ManagePanelRow;
