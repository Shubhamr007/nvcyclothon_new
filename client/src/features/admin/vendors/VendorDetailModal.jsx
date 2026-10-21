import React from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export function VendorDetailModal({
  selectedApp,
  onClose,
  onPreviewDocument,
  onOpenReview,
}) {
  if (!selectedApp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-semibold text-[#005a9e] bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 rounded-full uppercase">
              {selectedApp.category}
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-2">
              {selectedApp.business_name}
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
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Representative</span>
              <p className="font-semibold text-slate-900 text-sm mt-0.5">
                {selectedApp.representative_name || selectedApp.contact_name}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Phone & Email</span>
              <p className="font-semibold text-slate-900 mt-0.5">{selectedApp.phone}</p>
              <p className="text-slate-500">{selectedApp.email}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px]">GST / PAN</span>
              <p className="font-medium text-slate-900 mt-0.5">
                GST: {selectedApp.gst_number || "N/A"} | PAN: {selectedApp.pan_number || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Location</span>
              <p className="font-medium text-slate-900 mt-0.5">
                {selectedApp.address}, {selectedApp.city || "Rewa"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Products & Services</span>
            <p className="font-semibold text-sm text-slate-900 mt-1">{selectedApp.products_services}</p>
            <p className="mt-1 text-slate-600">{selectedApp.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Requirements</span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-slate-700">
              <p>Space: {selectedApp.space_requirement || "Standard"}</p>
              <p>Staff: {selectedApp.staff_count || 1}</p>
              <p>Electricity: {selectedApp.electricity_required ? "Yes" : "No"}</p>
              <p>Water: {selectedApp.water_required ? "Yes" : "No"}</p>
              <p>Furniture: {selectedApp.furniture_required ? "Yes" : "No"}</p>
              <p>Vehicle Access: {selectedApp.vehicle_access_required ? "Yes" : "No"}</p>
            </div>
          </div>

          {selectedApp.review_notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-900">
              <span className="font-semibold uppercase text-[10px]">Stall Allocation / Notes</span>
              <p className="mt-1">{selectedApp.review_notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
          {selectedApp.document_key && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreviewDocument(selectedApp.id)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Download Document
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onOpenReview(selectedApp)}
            className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-medium"
          >
            Change Status / Allocation
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VendorDetailModal;
