import React, { memo } from "react";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { PartnerTableRow } from "./PartnerTableRow";

export const PartnerApplicationsTable = memo(function PartnerApplicationsTable({
  loading = false,
  apps = [],
  selectedIds = [],
  onSelectAll,
  onToggleSelect,
  onViewDetails,
  onPreviewLogo,
  onOpenDeliverables,
  onOpenReview,
}) {
  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <LoadingIndicator label="Loading partner applications…" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <p className="text-xs text-slate-400 py-10 text-center">
        No partner applications found matching this criteria.
      </p>
    );
  }

  const allSelected = apps.length > 0 && apps.every((app) => selectedIds.includes(app.id));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
          <tr>
            <th className="p-3.5 text-center">
              <input
                type="checkbox"
                aria-label="Select all visible partner applications"
                checked={allSelected}
                onChange={(event) =>
                  onSelectAll(event.target.checked ? apps.map((app) => app.id) : [])
                }
                className="accent-slate-900 rounded cursor-pointer"
              />
            </th>
            <th className="p-3.5 font-semibold text-slate-700">Reference / Date</th>
            <th className="p-3.5 font-semibold text-slate-700">Company / Brand</th>
            <th className="p-3.5 font-semibold text-slate-700">Contact Person</th>
            <th className="p-3.5 font-semibold text-slate-700">Package & Type</th>
            <th className="p-3.5 font-semibold text-slate-700">Status</th>
            <th className="p-3.5 font-semibold text-slate-700 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {apps.map((app) => (
            <PartnerTableRow
              key={app.id}
              app={app}
              selected={selectedIds.includes(app.id)}
              onToggleSelect={onToggleSelect}
              onViewDetails={onViewDetails}
              onPreviewLogo={onPreviewLogo}
              onOpenDeliverables={onOpenDeliverables}
              onOpenReview={onOpenReview}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
