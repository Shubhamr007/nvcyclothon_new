import React, { memo } from "react";

export const VendorAllocationCard = memo(function VendorAllocationCard({ vendor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono font-medium text-xs text-slate-600">
          {vendor.application_number || `NV-26-V-${vendor.id}`}
        </span>
        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium uppercase">
          {vendor.status}
        </span>
      </div>
      <h5 className="mt-2 font-semibold text-base text-slate-900">
        {vendor.business_name} ({vendor.category})
      </h5>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <p>
          <strong>Space:</strong> {vendor.space_requirement || "To be allocated"}
        </p>
        <p>
          <strong>Staff Count:</strong> {vendor.staff_count || 1} team members
        </p>
        <p>
          <strong>Support:</strong>{" "}
          {vendor.electricity_required ? "Electricity; " : ""}
          {vendor.water_required ? "Water; " : ""}
        </p>
        {vendor.review_notes && (
          <p className="mt-2 rounded-lg bg-white border border-slate-200 p-2 text-slate-800 font-medium">
            <strong>Allocation Notes:</strong> {vendor.review_notes}
          </p>
        )}
      </div>
    </div>
  );
});

export default VendorAllocationCard;
