import React, { useRef } from "react";
import { toast } from "react-toastify";
import { Upload, Camera, Trash2, Loader2, Sparkles } from "lucide-react";
import { resolveApiAssetUrl, uploadAdminProfileImage } from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";

/**
 * Reusable Admin Image Uploader with large prominent photo preview,
 * professional photo guidance badge, and dual-backend upload handling (Cloudinary / Local API).
 */
export function AdminImageUploader({
  imageUrl = "",
  fallbackText = "NV",
  onImageUploaded,
  onImageRemoved,
  accessToken,
  isUploading = false,
  setIsUploading,
  label = "Profile Photo",
  aspectRatioLabel = "Recommended: Square 1:1 or Portrait, max 5MB",
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (setIsUploading) setIsUploading(true);

    try {
      let finalUrl = "";
      if (isCloudinaryConfigured()) {
        try {
          const cloudRes = await uploadImage(file, { folder: "nvcyclothon/admin" });
          finalUrl = cloudRes?.secure_url || cloudRes?.url || "";
        } catch (_) {
          // Fallback to local server API upload
        }
      }

      if (!finalUrl && accessToken) {
        const localRes = await uploadAdminProfileImage(accessToken, file);
        finalUrl = localRes?.url || localRes?.file_path || "";
      }

      if (finalUrl && onImageUploaded) {
        onImageUploaded(finalUrl);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      if (setIsUploading) setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          {aspectRatioLabel}
        </span>
      </div>

      {/* Prominent Large Photo Preview Area */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-[#faf9f6] p-4 transition-colors hover:border-[#0078d4]/40">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Large Image Frame */}
          <div className="relative shrink-0 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={resolveApiAssetUrl(imageUrl)}
                alt="Photo preview"
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border border-slate-200 shadow-sm ring-2 ring-white"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={`h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-linear-to-br from-[#0078d4] to-[#005a9e] text-white font-bold text-2xl shadow-sm ring-2 ring-white items-center justify-center ${
                imageUrl ? "hidden" : "flex"
              }`}
            >
              {fallbackText || "NV"}
            </div>

            {/* Uploading Spinner Overlay */}
            {isUploading && (
              <div className="absolute inset-0 rounded-2xl bg-slate-900/30 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-1.5 animate-in fade-in">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span>Uploading…</span>
              </div>
            )}
          </div>

          {/* Controls & Guidance */}
          <div className="flex-1 space-y-2.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>HD Official Presentation Setup</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload a high-resolution headshot. Crisp portraits enhance the committee directory and VIP presentation.
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs font-semibold px-3.5 py-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    {imageUrl ? "Change Photo" : "Upload Photo"}
                  </>
                )}
              </button>

              {imageUrl && onImageRemoved && (
                <button
                  type="button"
                  onClick={onImageRemoved}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-200 text-rose-600 text-xs font-semibold px-3 py-2 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminImageUploader;
