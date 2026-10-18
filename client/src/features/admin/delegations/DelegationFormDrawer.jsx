import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Flag, Crown, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";
import { AdminImageUploader } from "../components/AdminImageUploader";
import { parseGuestDetails } from "./DelegationTable";
import { DelegationProtocolFields, CEREMONY_ROLES } from "./DelegationProtocolFields";
import { DelegationLogisticsFields } from "./DelegationLogisticsFields";

export { CEREMONY_ROLES };

const BLANK_FORM = {
  is_chief_guest: false,
  organization: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  member_count: 1,
  status: "invited",
  designation: "",
  ceremony_role: "Chief Guest — Flag-off 50KM Elite Race",
  protocol_time: "05:30 AM",
  vehicle_pass: "",
  liaison_officer: "",
  general_notes: "",
  image_url: "",
};

export function DelegationFormDrawer({
  isOpen,
  onClose,
  mode = "add", // "add" | "edit"
  delegation = null,
  accessToken,
  onSave,
  isSaving = false,
}) {
  const [formData, setFormData] = useState(BLANK_FORM);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (delegation && mode === "edit") {
      const guestInfo = parseGuestDetails(delegation.notes);
      setFormData({
        is_chief_guest: Boolean(guestInfo.is_chief_guest),
        organization: delegation.organization || "",
        contact_name: delegation.contact_name || "",
        contact_email: delegation.contact_email || "",
        contact_phone: delegation.contact_phone || "",
        member_count: Number(delegation.member_count) || 1,
        status: delegation.status || "invited",
        designation: guestInfo.designation || "",
        ceremony_role: guestInfo.ceremony_role || CEREMONY_ROLES[0],
        protocol_time: guestInfo.protocol_time || "05:30 AM",
        vehicle_pass: guestInfo.vehicle_pass || "",
        liaison_officer: guestInfo.liaison_officer || "",
        general_notes: guestInfo.general_notes || "",
        image_url: guestInfo.image_url || "",
      });
    } else {
      setFormData(BLANK_FORM);
    }
  }, [delegation, mode, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.organization.trim() && !formData.contact_name.trim()) {
      toast.error("Please provide at least an Organization name or Dignitary Name.");
      return;
    }

    // Serialize notes
    const notesPayload = JSON.stringify({
      is_chief_guest: formData.is_chief_guest,
      designation: formData.designation,
      ceremony_role: formData.ceremony_role,
      protocol_time: formData.protocol_time,
      vehicle_pass: formData.vehicle_pass,
      liaison_officer: formData.liaison_officer,
      general_notes: formData.general_notes,
      image_url: formData.image_url,
    });

    const payload = {
      organization: formData.organization || formData.contact_name,
      contact_name: formData.contact_name || formData.organization,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,
      member_count: Number(formData.member_count) || 1,
      status: formData.status,
      notes: notesPayload,
    };

    onSave(payload, delegation?.id);
  };

  const isEdit = mode === "edit";

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !isSaving && !isUploadingPhoto && onClose()}
      title={isEdit ? "Edit VIP / Delegation" : "Add VIP / Delegation"}
      subtitle={
        formData.is_chief_guest
          ? "Configure Chief Guest, stage role, vehicle pass, and arrival protocol"
          : "Configure corporate or institutional delegation and liaison logistics"
      }
      icon={formData.is_chief_guest ? Crown : Flag}
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="space-y-6 p-6">
          {/* VIP / Chief Guest Toggle Header */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_chief_guest}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_chief_guest: e.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 accent-amber-600 rounded cursor-pointer"
              />
              <div>
                <span className="block font-bold text-xs uppercase tracking-wider text-slate-900">
                  Register as Chief Guest / VIP Dignitary
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Unlocks ceremony role assignments, stage address schedules, VIP vehicle entry pass, and liaison officer tracking.
                </span>
              </div>
            </label>
          </div>

          {/* Reusable Image Uploader for VIP Headshot */}
          {formData.is_chief_guest && (
            <AdminImageUploader
              imageUrl={formData.image_url}
              fallbackText={(formData.contact_name || "VIP").slice(0, 2).toUpperCase()}
              onImageUploaded={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
              onImageRemoved={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
              accessToken={accessToken}
              isUploading={isUploadingPhoto}
              setIsUploading={setIsUploadingPhoto}
              label="Chief Guest Official Portrait"
              aspectRatioLabel="Recommended: Square 1:1, Stage/Brochure Resolution"
            />
          )}

          {/* Core Name & Organization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Dignitary / Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contact_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
                placeholder="e.g. Hon. Shri Rajesh Singh"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Organization / Institution <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.organization}
                onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
                placeholder="e.g. Government of MP / Rewa Police Dept"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Protocol & VIP Fields */}
          <DelegationProtocolFields
            formData={formData}
            setFormData={setFormData}
            ceremonyRoles={CEREMONY_ROLES}
          />

          {/* Contact Details, Member Count, Status, and Logistics Notes */}
          <DelegationLogisticsFields
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isUploadingPhoto}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isUploadingPhoto}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-sm transition"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Record…
              </span>
            ) : isEdit ? (
              "Update VIP / Delegation"
            ) : (
              "Save Record"
            )}
          </Button>
        </div>
      </form>
    </AdminSlideOver>
  );
}

export default DelegationFormDrawer;
