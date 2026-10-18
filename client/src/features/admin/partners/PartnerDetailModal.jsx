import React from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function PartnerDetailModal({
  selectedApp,
  onClose,
  onPreviewLogo,
  onOpenReview,
}) {
  if (!selectedApp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-mono font-medium text-blue-600">
              {selectedApp.application_number || `NV-26-P-${selectedApp.id}`}
            </span>
            <h4 className="text-lg font-bold text-slate-900">
              {selectedApp.company_name}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Contact Person</span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedApp.contact_name}</p>
              <p className="text-slate-500">{selectedApp.designation || "N/A"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone & Email</span>
              <p className="font-semibold text-slate-900 mt-0.5">{selectedApp.phone}</p>
              <p className="text-slate-500">{selectedApp.email}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Business Type</span>
              <p className="font-medium text-slate-900 mt-0.5">{selectedApp.business_type || "Corporate"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Website</span>
              <p className="font-medium text-slate-900 mt-0.5">{selectedApp.website || "—"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">GST / PAN</span>
              <p className="font-medium text-slate-900 mt-0.5">
                GST: {selectedApp.gst_number || "N/A"} | PAN: {selectedApp.pan_number || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Location</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {selectedApp.city || "—"}, {selectedApp.state || "—"} ({selectedApp.pincode || "—"})
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Partnership Proposal</span>
            <p className="font-semibold text-sm text-blue-600 mt-1">
              {selectedApp.package_name || selectedApp.tier_name || "Custom"} ({selectedApp.partnership_type})
            </p>
            {selectedApp.proposed_value && (
              <p className="mt-1 text-slate-700 font-medium">Proposed Value: {selectedApp.proposed_value}</p>
            )}
            {selectedApp.custom_description && (
              <p className="mt-1 text-slate-600 italic">&ldquo;{selectedApp.custom_description}&rdquo;</p>
            )}
          </div>

          {selectedApp.activation_description && (
            <div className="rounded-xl border border-slate-200 p-4">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Activation Intent</span>
              <p className="mt-1 text-slate-700">{selectedApp.activation_description}</p>
            </div>
          )}

          {selectedApp.review_notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900">
              <span className="font-semibold uppercase text-[10px]">Reviewer Notes</span>
              <p className="mt-1">{selectedApp.review_notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          {selectedApp.logo_key && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreviewLogo(selectedApp.id)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Download Logo
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onOpenReview(selectedApp)}
            className="bg-slate-900 text-white hover:bg-slate-800 font-medium"
          >
            Change Status / Notes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PartnerDetailModal;
