import React from "react";
import { Button } from "../../../components/ui/button";

export function VendorReviewModal({
  reviewModal,
  onClose,
  onChangeStatusNotes,
  onSave,
}) {
  if (!reviewModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <h4 className="text-lg font-bold text-slate-900">
          Update Vendor Status
        </h4>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Status
            </label>
            <select
              value={reviewModal.status}
              onChange={(e) => onChangeStatusNotes("status", e.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:border-[#0078d4] focus:outline-none"
            >
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="EVENT_READY">EVENT READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Allocation / Operations Notes
            </label>
            <textarea
              rows={3}
              value={reviewModal.notes}
              onChange={(e) => onChangeStatusNotes("notes", e.target.value)}
              placeholder="Record space allocation, power requirements, or review feedback..."
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0078d4] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
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
            className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-medium"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VendorReviewModal;
