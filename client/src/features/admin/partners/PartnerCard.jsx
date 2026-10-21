import React, { memo } from "react";
import { Button } from "../../../components/ui/button";

export const PartnerCard = memo(function PartnerCard({
  partner,
  onPreviewLogo,
  onOpenDeliverables,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium uppercase">
          {partner.status}
        </span>
        <span className="text-xs font-semibold text-[#005a9e]">
          {partner.package_name || partner.tier_name || "Partner"}
        </span>
      </div>
      <h5 className="mt-3 font-semibold text-base text-slate-900">
        {partner.brand_name || partner.company_name}
      </h5>
      <p className="text-xs text-slate-500 mt-1">
        Contact: {partner.contact_name} ({partner.phone})
      </p>
      <div className="mt-4 flex gap-2">
        {partner.logo_key && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreviewLogo(partner.id)}
            className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Logo
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => onOpenDeliverables(partner)}
          className="h-7 text-xs bg-[#0078d4] hover:bg-[#005a9e] text-white font-medium"
        >
          Deliverables
        </Button>
      </div>
    </div>
  );
});

export default PartnerCard;
