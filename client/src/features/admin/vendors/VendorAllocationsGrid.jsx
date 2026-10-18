import React, { memo } from "react";
import { VendorAllocationCard } from "./VendorAllocationCard";

export const VendorAllocationsGrid = memo(function VendorAllocationsGrid({
  approvedVendors = [],
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <h4 className="text-base font-bold text-slate-900 mb-4">
        Stall & Operational Allocations
      </h4>
      {approvedVendors.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">No approved vendors yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approvedVendors.map((v) => (
            <VendorAllocationCard key={v.id} vendor={v} />
          ))}
        </div>
      )}
    </div>
  );
});
