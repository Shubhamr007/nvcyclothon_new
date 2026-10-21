import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { AdminSlideOver } from "../components/AdminSlideOver";
import { AdminImageUploader } from "../components/AdminImageUploader";

const BLANK_FORM = {
  name: "",
  role: "",
  message: "",
  image_url: "",
  display_order: 0,
  visible: true,
};

export function MemberFormDrawer({
  isOpen,
  onClose,
  mode = "add", // "add" | "edit"
  member = null,
  accessToken,
  onSave,
  isSaving = false,
}) {
  const [formData, setFormData] = useState(BLANK_FORM);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (member && mode === "edit") {
      setFormData({
        name: member.name || "",
        role: member.role || "",
        message: member.message || "",
        image_url: member.image_url || "",
        display_order: Number(member.display_order) || 0,
        visible: Boolean(member.visible),
      });
    } else {
      setFormData(BLANK_FORM);
    }
  }, [member, mode, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please provide the member's full name.");
      return;
    }
    onSave(formData, member?.id);
  };

  const isEdit = mode === "edit";

  return (
    <AdminSlideOver
      isOpen={isOpen}
      onClose={() => !isSaving && !isUploadingPhoto && onClose()}
      title={isEdit ? "Edit Organizing Member" : "Add Organizing Member"}
      subtitle={
        isEdit
          ? "Update the executive profile, quote, or display order"
          : "Add a new executive or committee member to the public directory"
      }
      icon={User}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="space-y-6 p-6">
          {/* Reusable Image Uploader with Large Prominent Preview */}
          <AdminImageUploader
            imageUrl={formData.image_url}
            fallbackText={(formData.name || "NV").slice(0, 2).toUpperCase()}
            onImageUploaded={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
            onImageRemoved={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
            accessToken={accessToken}
            isUploading={isUploadingPhoto}
            setIsUploading={setIsUploadingPhoto}
            label="Official Profile Photo"
            aspectRatioLabel="Recommended: 1:1 Square, neutral backdrop"
          />

          {/* Name & Role Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Rajesh Sharma"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Role / Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="e.g. Event Director / Patron"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
              />
            </div>
          </div>

          {/* Display Order & Visibility Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Display Order Sequence
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_order: Number(e.target.value) || 0,
                  }))
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Lower numbers appear first on the website.</p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Website Visibility
              </label>
              <label className="flex items-center gap-3 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                <input
                  type="checkbox"
                  checked={formData.visible}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, visible: e.target.checked }))
                  }
                  className="accent-[#0078d4] rounded cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  {formData.visible ? (
                    <>
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span>Live on Website</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-slate-400" />
                      <span>Hidden (Draft)</span>
                    </>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Statement / Quote Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Statement / Quote
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="A brief motivational message, vision, or welcoming note from this committee member…"
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4] leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Footer Action Bar */}
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
            className="bg-[#0078d4] hover:bg-[#005a9e] text-white font-semibold text-xs rounded-xl h-10 px-6 shadow-sm transition"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Member…
              </span>
            ) : isEdit ? (
              "Update Member"
            ) : (
              "Save & Publish"
            )}
          </Button>
        </div>
      </form>
    </AdminSlideOver>
  );
}

export default MemberFormDrawer;
