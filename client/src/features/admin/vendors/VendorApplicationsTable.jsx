import React, { memo } from "react";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { VendorTableRow } from "./VendorTableRow";

export const VendorApplicationsTable = memo(function VendorApplicationsTable({
  loading = false,
  apps = [],
  selectedIds = [],
  onSelectAll,
  onToggleSelect,
  onViewDetails,
  onPreviewDocument,
  onOpenReview,
}) {
  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingIndicator label="Loading vendor applications…" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <p className="text-xs text-slate-400 py-10 text-center">
        No vendor applications found matching this criteria.
      </p>
    );
  }

  const allSelected = apps.length > 0 && apps.every((v) => selectedIds.includes(v.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
          <tr>
            <th className="p-3.5 text-center">
              <input
                type="checkbox"
                aria-label="Select all visible vendor applications"
                checked={allSelected}
                onChange={(event) =>
                  onSelectAll?.(event.target.checked ? apps.map((v) => v.id) : [])
                }
                className="accent-slate-900 rounded cursor-pointer"
              />
            </th>
            <th className="p-3.5 font-semibold text-slate-700">Reference / Date</th>
            <th className="p-3.5 font-semibold text-slate-700">Business Name</th>
            <th className="p-3.5 font-semibold text-slate-700">Category</th>
            <th className="p-3.5 font-semibold text-slate-700">Representative</th>
            <th className="p-3.5 font-semibold text-slate-700">Status</th>
            <th className="p-3.5 font-semibold text-slate-700 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((v) => (
            <VendorTableRow
              key={v.id}
              vendor={v}
              selected={selectedIds.includes(v.id)}
              onToggleSelect={onToggleSelect}
              onViewDetails={onViewDetails}
              onPreviewDocument={onPreviewDocument}
              onOpenReview={onOpenReview}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
