import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Sparkles } from "lucide-react";
import { SelectedDeleteAction } from "../components/SelectedDeleteAction";
import { ManagePanelRow } from "../components/ManagePanelRow";
import { ManagePanelForm } from "../components/ManagePanelForm";

export { ManagePanelRow, ManagePanelForm };

function toEditableForm(fields, item) {
  const next = { ...fields };
  for (const key of Object.keys(fields)) {
    if (item[key] !== undefined && item[key] !== null) {
      next[key] = item[key];
    }
  }
  return next;
}

export function ManagePanel({
  title,
  fields,
  items = [],
  onSave,
  onRemove,
  onBulkRemove,
  render,
  adminKey,
  icon: Icon = Sparkles,
  description,
}) {
  const [form, setForm] = useState(fields);
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const reset = useCallback(() => {
    setForm(fields);
    setEditing(null);
  }, [fields]);

  const submit = (event) => {
    event.preventDefault();
    const normalized = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        key === "member_count" || key === "display_order"
          ? Number(value)
          : value,
      ])
    );
    onSave(normalized, reset, editing);
  };

  const beginEdit = useCallback(
    (item) => {
      setEditing(item.id);
      setForm(toEditableForm(fields, item));
    },
    [fields]
  );

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  const handleBulkDelete = useCallback(async () => {
    try {
      await onBulkRemove?.(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete items.");
    }
  }, [selectedIds, onBulkRemove]);

  const handleRemovePhoto = useCallback(() => {
    setForm((current) => ({ ...current, image_url: "" }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-[#0078d4]" />
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        <span className="rounded-full bg-[#deecf9] border border-[#c7e0f4] px-3 py-1 text-xs font-semibold text-[#005a9e]">
          {items.length} Record{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <SelectedDeleteAction
        count={selectedIds.length}
        label={title.toLowerCase()}
        onDelete={handleBulkDelete}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* FORM */}
        <ManagePanelForm
          title={title}
          form={form}
          setForm={setForm}
          editing={editing}
          onSubmit={submit}
          onCancelEdit={reset}
          adminKey={adminKey}
          uploadingPhoto={uploadingPhoto}
          setUploadingPhoto={setUploadingPhoto}
          onRemovePhoto={handleRemovePhoto}
        />

        {/* LIST VIEW */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
              No entries recorded in this list yet.
            </div>
          ) : (
            items.map((item) => (
              <ManagePanelRow
                key={item.id}
                item={item}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
                onEdit={beginEdit}
                render={render}
                title={title}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagePanel;
