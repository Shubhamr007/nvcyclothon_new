import React from "react";
import { Button } from "../../../components/ui/button";
import { StatusBadge } from "../components/StatusBadge";

export const VendorTableRow = React.memo(function VendorTableRow({
  vendor,
  selected,
  onToggleSelect,
  onViewDetails,
  onPreviewDocument,
  onOpenReview,
}) {
  return (
    <tr
      className={`border-b border-slate-100 transition-colors ${
        selected ? "bg-[#deecf9]/40" : "hover:bg-slate-50/70"
      }`}
    >
      <td className="p-3.5 text-center">
        <input
          type="checkbox"
          aria-label={`Select vendor application ${vendor.application_number || vendor.id}`}
          checked={selected}
          onChange={() => onToggleSelect(vendor.id)}
          className="accent-[#0078d4] rounded cursor-pointer"
        />
      </td>
      <td className="p-3.5 whitespace-nowrap">
        <span className="font-mono font-medium text-slate-800">
          {vendor.application_number || `NV-26-V-${vendor.id}`}
        </span>
        <div className="text-[10px] text-slate-400">
          {new Date(vendor.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="p-3.5">
        <span className="font-semibold text-sm text-slate-900 block">
          {vendor.business_name}
        </span>
        <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
          {vendor.products_services || vendor.description}
        </span>
      </td>
      <td className="p-3.5">
        <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
          {vendor.category}
        </span>
      </td>
      <td className="p-3.5">
        <div className="font-medium text-slate-900">{vendor.representative_name || vendor.contact_name}</div>
        <div className="text-[11px] text-slate-500">{vendor.phone}</div>
      </td>
      <td className="p-3.5 whitespace-nowrap">
        <StatusBadge status={vendor.status} />
      </td>
      <td className="p-3.5 text-right whitespace-nowrap">
        <div className="inline-flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(vendor)}
            className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Details
          </Button>
          {vendor.document_key && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreviewDocument(vendor.id)}
              className="h-7 px-2 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Document
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            onClick={() => onOpenReview(vendor)}
            className="h-7 px-2 text-[11px] bg-[#0078d4] hover:bg-[#005a9e] text-white font-medium"
          >
            Status
          </Button>
        </div>
      </td>
    </tr>
  );
});

export default VendorTableRow;
