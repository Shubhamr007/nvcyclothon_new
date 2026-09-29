import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, ExternalLink } from "lucide-react";
import { useCloudinaryUpload } from "../services/useCloudinaryUpload";
import { getOptimizedImageUrl } from "../services/cloudinary";

/**
 * Reusable Cloudinary Image Upload Component
 *
 * Supports drag-and-drop, real-time upload progress, preview,
 * URL optimization, and direct unsigned upload to Cloudinary.
 */
export function ImageUpload({
  value = "",
  onChange,
  folder = "nvcyclothon",
  tags = ["cyclothon"],
  label = "Upload Image",
  description = "PNG, JPG, or WebP up to 10MB",
  maxSizeMB = 10,
  aspectRatio = "auto",
  className = "",
  disabled = false,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const fileInputRef = useRef(null);

  const {
    upload,
    isUploading,
    progress,
    error,
    cancel,
    reset,
    isConfigured,
  } = useCloudinaryUpload({
    folder,
    tags,
    maxSizeBytes: maxSizeMB * 1024 * 1024,
  });

  const handleFile = useCallback(
    async (file) => {
      if (!file || disabled || isUploading) return;

      // Show local preview immediately for great UX
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        const res = await upload(file);
        if (res && res.secureUrl) {
          setPreviewUrl(res.secureUrl);
          if (typeof onChange === "function") {
            onChange(res.secureUrl, res);
          }
        }
      } catch {
        // Error is captured in hook state; revert preview if no previous value
        if (!value) {
          setPreviewUrl("");
        } else {
          setPreviewUrl(value);
        }
      } finally {
        URL.revokeObjectURL(localPreview);
      }
    },
    [disabled, isUploading, upload, value, onChange]
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled || isUploading) return;

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, isUploading, handleFile]
  );

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    reset();
    setPreviewUrl("");
    if (typeof onChange === "function") {
      onChange("", null);
    }
  };

  const handleCancelUpload = (e) => {
    e.stopPropagation();
    cancel();
    setPreviewUrl(value || "");
  };

  const triggerSelect = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
          {label}
        </label>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Upload Box / Preview Box */}
      <div
        onClick={triggerSelect}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
          dragActive
            ? "border-[#d9ff38] bg-[#d9ff38]/10 scale-[1.01]"
            : "border-white/15 bg-[#071313]/80 hover:border-white/30 hover:bg-[#071313]"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        {/* If image exists (preview or uploaded) */}
        {previewUrl ? (
          <div className="relative w-full flex items-center justify-center p-4 min-h-[160px] bg-black/40">
            <img
              src={getOptimizedImageUrl(previewUrl, { width: 800, quality: "auto", format: "auto" })}
              alt="Uploaded Preview"
              className={`max-h-56 max-w-full rounded-xl object-contain shadow-md transition-opacity duration-300 ${
                isUploading ? "opacity-40" : "opacity-100"
              }`}
            />

            {/* In-flight overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
                <Loader2 className="w-8 h-8 text-[#d9ff38] animate-spin mb-3" />
                <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="bg-[#d9ff38] h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  Uploading {progress}%
                </span>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 font-bold underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Hover Actions when uploaded */}
            {!isUploading && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {previewUrl.startsWith("http") && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black transition"
                    title="Open full size"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Success Badge */}
            {!isUploading && value && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#d9ff38]/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d9ff38]" />
                <span className="text-[11px] font-bold text-[#d9ff38] tracking-wider uppercase">
                  Uploaded
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Empty State / Dropzone */
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[170px]">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-[#d9ff38] animate-spin mb-3" />
                <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className="bg-[#d9ff38] h-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white tracking-widest uppercase">
                  Uploading {progress}%
                </span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#d9ff38] group-hover:scale-110 group-hover:border-[#d9ff38]/50 transition-all duration-300 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">
                  Click to upload <span className="text-white/40 font-normal">or drag & drop</span>
                </p>
                {description && (
                  <p className="text-xs text-white/50 mt-1">{description}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message with Help */}
      {error && (
        <div className="mt-2.5 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Upload Error:</span> {error}
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-[11px] underline font-bold hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unconfigured Warning Note for Developer/Admin */}
      {!isConfigured && !error && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400/80">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Cloudinary environment variables (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET) are not yet configured.</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
