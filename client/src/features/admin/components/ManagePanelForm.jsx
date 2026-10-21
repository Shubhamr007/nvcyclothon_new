import React, { memo } from "react";
import { toast } from "react-toastify";
import { resolveApiAssetUrl, uploadAdminProfileImage } from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";
import { Button } from "../../../components/ui/button";
import { Upload } from "lucide-react";

export const ManagePanelForm = memo(function ManagePanelForm({
  title,
  form,
  setForm,
  editing,
  onSubmit,
  onCancelEdit,
  adminKey,
  uploadingPhoto,
  setUploadingPhoto,
  onRemovePhoto,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">
          {editing ? `Edit ${title}` : `Add New ${title}`}
        </h3>
        {editing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <div className="space-y-3 pt-1">
        {Object.entries(form).map(([name, value]) => (
          <div key={name}>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-mono">
              {name === "image_url" ? "Profile Photograph" : name.replaceAll("_", " ")}
            </label>

            {typeof value === "boolean" ? (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setForm({ ...form, [name]: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#0078d4]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Enable / Active on website
                </span>
              </label>
            ) : name === "notes" ||
              name === "bio" ||
              name === "description" ||
              name === "message" ? (
              <textarea
                rows={3}
                value={value}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none transition-all"
              />
            ) : name === "image_url" && adminKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer w-fit rounded-lg border border-slate-200 bg-[#faf9f6] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white hover:border-[#0078d4]/40 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingPhoto ? "Uploading photo…" : value ? "Replace Photo" : "Upload Photo"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingPhoto}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (!file) return;
                        setUploadingPhoto(true);
                        try {
                          if (isCloudinaryConfigured().hasCloudinary) {
                            const result = await uploadImage(file, { folder: "nvcyclothon/profiles" });
                            setForm((current) => ({ ...current, image_url: result.secureUrl }));
                          } else {
                            const result = await uploadAdminProfileImage(adminKey, file);
                            setForm((current) => ({ ...current, image_url: result.image_url }));
                          }
                        } catch (error) {
                          toast.error(error.message);
                        } finally {
                          input.value = "";
                          setUploadingPhoto(false);
                        }
                      }}
                    />
                  </label>
                  {value && (
                    <button
                      type="button"
                      onClick={onRemovePhoto}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Choose an image from your device to attach to this profile.
                </p>
                {value && (
                  <img
                    src={resolveApiAssetUrl(value)}
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 mt-1 shadow-xs"
                  />
                )}
              </div>
            ) : name === "category" ? (
              <select
                value={value || "Event"}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none transition-all"
              >
                <option value="Organizers">Organizers & Race Directors</option>
                <option value="Partners">Official Partners & Sponsors</option>
                <option value="Riders">Riders & Peloton Moments</option>
                <option value="Highlights">Route & Event Highlights</option>
                <option value="Event">General Event Photography</option>
              </select>
            ) : (
              <input
                required={
                  !["contact_email", "contact_phone", "code", "image_url", "caption"].includes(name)
                }
                type={typeof value === "number" ? "number" : "text"}
                value={value}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none transition-all"
              />
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 flex items-center gap-2">
        <Button
          type="submit"
          variant="default"
          disabled={uploadingPhoto}
          className="w-full bg-[#0078d4] hover:bg-[#005a9e] text-white rounded-xl font-semibold h-9 text-xs transition-colors"
        >
          {editing ? "Save Changes" : `Create ${title}`}
        </Button>
      </div>
    </form>
  );
});

export default ManagePanelForm;
