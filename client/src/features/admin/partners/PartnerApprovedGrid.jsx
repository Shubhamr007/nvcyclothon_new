import React, { memo } from "react";
import { PartnerCard } from "./PartnerCard";

export const PartnerApprovedGrid = memo(function PartnerApprovedGrid({
  approvedList = [],
  onPreviewLogo,
  onOpenDeliverables,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <h4 className="text-base font-bold text-slate-900 mb-4">
        Approved Event Partners
      </h4>
      {approvedList.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">No approved partners yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approvedList.map((p) => (
            <PartnerCard
              key={p.id}
              partner={p}
              onPreviewLogo={onPreviewLogo}
              onOpenDeliverables={onOpenDeliverables}
            />
          ))}
        </div>
      )}
    </div>
  );
});
