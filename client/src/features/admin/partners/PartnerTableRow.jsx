import React from "react";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../components/StatusBadge";

export const PartnerTableRow = React.memo(function PartnerTableRow({
  app,
  selected,
  onToggleSelect,
  onViewDetails,
  onPreviewLogo,
  onOpenDeliverables,
  onOpenReview,
}) {
  return (
    <tr
      className={`border-b border-slate-100 transition-colors ${
        selected ? "bg-slate-50/80" : "hover:bg-slate-50/50"
      }`}
    >
      <td className="p-3.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(app.id)}
          aria-label={`Select ${app.company_name}`}
          className="accent-slate-900 rounded cursor-pointer"
        />
      </td>
      <td className="p-3.5 whitespace-nowrap">
        <span className="font-mono font-medium text-slate-800">
          {app.application_number || `NV-26-P-${app.id}`}
        </span>
        <div className="text-[10px] text-slate-400">
          {new Date(app.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="p-3.5">
        <span className="font-semibold text-sm text-slate-900 block">
          {app.company_name}
        </span>
        {app.brand_name && app.brand_name !== app.company_name && (
          <span className="text-[11px] text-slate-500">Brand: {app.brand_name}</span>
        )}
      </td>
      <td className="p-3.5">
        <div className="font-medium text-slate-900">{app.contact_name}</div>
        <div className="text-[11px] text-slate-500">{app.phone} • {app.email}</div>
      </td>
      <td className="p-3.5">
        <div className="font-medium text-blue-600">
          {app.package_name || app.tier_name || "Custom Tier"}
        </div>
        <div className="text-[10px] text-slate-400">{app.partnership_type}</div>
      </td>
      <td className="p-3.5 whitespace-nowrap">
        <StatusBadge status={app.status} />
      </td>
      <td className="p-3.5 text-right whitespace-nowrap">
        <div className="inline-flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(app)}
            className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Details
          </Button>
          {app.logo_key && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreviewLogo(app.id)}
              className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Logo
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDeliverables(app)}
            className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Deliverables
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => onOpenReview(app)}
            className="h-7 px-2 text-[11px] bg-slate-900 text-white hover:bg-slate-800 font-medium"
          >
            Status
          </Button>
        </div>
      </td>
    </tr>
  );
});

export default PartnerTableRow;
