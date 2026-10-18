import React from "react";
import { Button } from "../../../components/ui/button";

export function PartnerReviewModal({
  reviewModal,
  onClose,
  onChangeStatusNotes,
  onSave,
}) {
  if (!reviewModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <h4 className="text-lg font-bold text-slate-900">
          Update Application Status
        </h4>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Select Workflow Status
            </label>
            <select
              value={reviewModal.status}
              onChange={(e) => onChangeStatusNotes("status", e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="SHORTLISTED">SHORTLISTED</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
              <option value="PAYMENT_VERIFIED">PAYMENT VERIFIED</option>
              <option value="ASSETS_PENDING">ASSETS PENDING</option>
              <option value="ASSETS_APPROVED">ASSETS APPROVED</option>
              <option value="EVENT_READY">EVENT READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Internal Review Notes / Terms
            </label>
            <textarea
              rows={3}
              value={reviewModal.notes}
              onChange={(e) => onChangeStatusNotes("notes", e.target.value)}
              placeholder="Record commercial discussion terms or feedback..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(reviewModal.id, reviewModal.status, reviewModal.notes)}
            className="bg-slate-900 text-white hover:bg-slate-800 font-medium"
          >
            Save Status
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PartnerReviewModal;
