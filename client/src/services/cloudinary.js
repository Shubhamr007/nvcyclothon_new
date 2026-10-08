/**
 * Cloudinary Unsigned Image Upload Service
 *
 * Enables direct client-side image uploads to Cloudinary without exposing
 * API secrets, using an unsigned upload preset.
 *
 * Requirements in Cloudinary:
 * 1. Cloud Name (found in your Cloudinary Dashboard)
 * 2. Unsigned Upload Preset (Settings -> Upload -> Upload presets -> Add preset -> Signing Mode: 'Unsigned')
 */

// API Base URL for native storage fallback
const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
const API_BASE = `${API_BASE_URL.replace(/\/$/, "")}/api`;

// Default configuration from Vite environment variables
const DEFAULT_CONFIG = {
  cloudName: (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME) || "",
  uploadPreset: (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET) || "",
  folder: (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUDINARY_FOLDER) || "media",
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB default limit
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "image/avif",
  ],
};

let activeConfig = { ...DEFAULT_CONFIG };

/**
 * Configure or override Cloudinary settings at runtime.
 * @param {Partial<typeof DEFAULT_CONFIG>} options
 */
export function configureCloudinary(options = {}) {
  activeConfig = {
    ...activeConfig,
    ...options,
  };
}

/**
 * Reset configuration to default environment values.
 */
export function resetCloudinaryConfig() {
  activeConfig = { ...DEFAULT_CONFIG };
}

/**
 * Check whether Cloudinary or native storage is configured.
 * Native storage engine is always available at $0 cost on the VPS.
 * @param {Object} [overrides] - Optional overrides to check
 * @returns {{ configured: boolean, hasCloudinary: boolean, provider: string, cloudName: string, uploadPreset: string, missing: string[] }}
 */
export function isCloudinaryConfigured(overrides = {}) {
  const cloudName = overrides.cloudName || activeConfig.cloudName;
  const uploadPreset = overrides.uploadPreset || activeConfig.uploadPreset;
  const hasCloudinary = Boolean(cloudName && uploadPreset);

  return {
    configured: true, // Native VPS storage is always ready and available
    hasCloudinary,
    provider: hasCloudinary ? "cloudinary" : "native",
    cloudName,
    uploadPreset,
    missing: hasCloudinary ? [] : ["VITE_CLOUDINARY_CLOUD_NAME", "VITE_CLOUDINARY_UPLOAD_PRESET"],
  };
}

/**
 * Validate a file before attempting upload.
 * @param {File|Blob} file
 * @param {Object} [options]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file, options = {}) {
  if (!file) {
    return { valid: false, error: "Please select an image file to upload." };
  }

  const maxSize = options.maxSizeBytes || activeConfig.maxSizeBytes;
  const allowedMimes = options.allowedMimeTypes || activeConfig.allowedMimeTypes;

  // File size validation
  if (file.size > maxSize) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is ${maxMb} MB.`,
    };
  }

  // MIME type validation (if file has a type)
  if (file.type && allowedMimes.length > 0 && !allowedMimes.includes(file.type.toLowerCase())) {
    const readableFormats = allowedMimes
      .map((m) => m.replace("image/", "").replace("+xml", "").toUpperCase())
      .join(", ");
    return {
      valid: false,
      error: `Invalid file format (${file.type}). Supported formats: ${readableFormats}.`,
    };
  }

  return { valid: true };
}

/**
 * Upload a single image to Cloudinary using an unsigned upload preset.
 *
 * @param {File|Blob|string} file - The File, Blob, Data URI, or URL to upload.
 * @param {Object} [options] - Upload options
 * @param {string} [options.cloudName] - Cloudinary Cloud Name (defaults to env)
 * @param {string} [options.uploadPreset] - Cloudinary Unsigned Upload Preset (defaults to env)
 * @param {string} [options.folder] - Target folder in Cloudinary (defaults to env folder or "nvcyclothon")
 * @param {string[]|string} [options.tags] - Array or comma-delimited tags
 * @param {Record<string, string>} [options.context] - Metadata key-value pairs
 * @param {string} [options.publicId] - Optional custom public ID (if preset allows)
 * @param {string} [options.resourceType="image"] - Resource type ("image", "auto", "raw")
 * @param {number} [options.maxSizeBytes] - Max allowed file size in bytes
 * @param {string[]} [options.allowedMimeTypes] - Allowed MIME types
 * @param {(progress: { loaded: number, total: number, percent: number }) => void} [options.onProgress] - Upload progress callback
 * @param {AbortSignal} [options.signal] - AbortSignal for upload cancellation
 * @returns {Promise<{
 *   success: boolean,
 *   url: string,
 *   secureUrl: string,
 *   publicId: string,
 *   format: string,
 *   width: number,
 *   height: number,
 *   bytes: number,
 *   originalFilename: string,
 *   createdAt: string,
 *   resourceType: string,
 *   raw: Object
 * }>}
 */
export function uploadImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const cloudName = options.cloudName || activeConfig.cloudName;
    const uploadPreset = options.uploadPreset || activeConfig.uploadPreset;
    const folder = options.folder !== undefined ? options.folder : activeConfig.folder;
    const resourceType = options.resourceType || "image";

    // 1. Determine provider: use Cloudinary only if explicitly requested or configured and not overridden
    const useCloudinary =
      options.provider === "cloudinary" ||
      (Boolean(cloudName && uploadPreset) && options.provider !== "native");

    // 2. Validate File (if File or Blob)
    if (file instanceof Blob || (typeof File !== "undefined" && file instanceof File)) {
      const validation = validateImageFile(file, options);
      if (!validation.valid) {
        return reject(new Error(validation.error));
      }
    } else if (!file) {
      return reject(new Error("No file provided for upload."));
    }

    // 3. Build FormData
    const formData = new FormData();
    if (useCloudinary) {
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      if (folder) {
        formData.append("folder", folder);
      }

      if (options.tags) {
        const tagsString = Array.isArray(options.tags) ? options.tags.join(",") : options.tags;
        formData.append("tags", tagsString);
      }

      if (options.context && typeof options.context === "object") {
        const contextString = Object.entries(options.context)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join("|");
        formData.append("context", contextString);
      }

      if (options.publicId) {
        formData.append("public_id", options.publicId);
      }
    } else {
      // Native storage engine on VPS
      formData.append("file", file);
      if (folder) {
        formData.append("folder", folder);
      }
    }

    // 4. Send via XMLHttpRequest for accurate progress tracking
    const xhr = new XMLHttpRequest();
    const uploadUrl = useCloudinary
      ? `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${encodeURIComponent(resourceType)}/upload`
      : `${API_BASE}/uploads/image`;

    // Handle cancellation signal
    if (options.signal) {
      if (options.signal.aborted) {
        return reject(new DOMException("Upload aborted by user", "AbortError"));
      }
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Upload aborted by user", "AbortError"));
      });
    }

    // Upload progress event listener
    if (typeof options.onProgress === "function") {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          options.onProgress({
            loaded: event.loaded,
            total: event.total,
            percent,
          });
        }
      });
    }

    // Completion handler
    xhr.addEventListener("load", () => {
      let responseBody = null;
      try {
        responseBody = JSON.parse(xhr.responseText);
      } catch {
        responseBody = { error: { message: xhr.responseText || `HTTP status ${xhr.status}` } };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const rawUrl = responseBody.secure_url || responseBody.url;
        const normalizedUrl =
          rawUrl && rawUrl.startsWith("/") && API_BASE_URL
            ? `${API_BASE_URL.replace(/\/$/, "")}${rawUrl}`
            : rawUrl;

        resolve({
          success: true,
          url: normalizedUrl,
          secureUrl: normalizedUrl,
          secure_url: normalizedUrl,
          publicId: responseBody.public_id || responseBody.key,
          key: responseBody.key || responseBody.public_id,
          format: responseBody.format || "webp",
          width: responseBody.width || null,
          height: responseBody.height || null,
          bytes: responseBody.bytes || responseBody.size_bytes || 0,
          size_bytes: responseBody.size_bytes || responseBody.bytes || 0,
          originalFilename:
            responseBody.original_filename || (file instanceof File ? file.name : "image"),
          createdAt: responseBody.created_at || new Date().toISOString(),
          resourceType: responseBody.resource_type || "image",
          raw: responseBody,
        });
      } else {
        const errorMsg = useCloudinary
          ? formatCloudinaryError(responseBody, xhr.status, uploadPreset, cloudName)
          : responseBody?.detail ||
            responseBody?.error?.message ||
            `Upload failed with status ${xhr.status}`;
        const err = new Error(errorMsg);
        err.status = xhr.status;
        err.raw = responseBody;
        reject(err);
      }
    });

    // Error and Abort handlers
    xhr.addEventListener("error", () => {
      reject(
        new Error(
          useCloudinary
            ? "Network error during Cloudinary upload. Please check your internet connection."
            : "Network error during image upload. Please check your internet connection."
        )
      );
    });

    xhr.addEventListener("abort", () => {
      reject(new DOMException("Upload cancelled.", "AbortError"));
    });

    // Execute Request
    xhr.open("POST", uploadUrl, true);
    xhr.send(formData);
  });
}

/**
 * Upload multiple images with concurrency control and progress tracking.
 *
 * @param {Array<File|Blob|string>|FileList} files
 * @param {Object} [options]
 * @param {number} [options.concurrency=3] - Maximum parallel uploads
 * @param {(overall: { loaded: number, total: number, percent: number, completedCount: number }) => void} [options.onOverallProgress]
 * @param {(fileIndex: number, progress: { loaded: number, total: number, percent: number }) => void} [options.onFileProgress]
 * @param {(fileIndex: number, result: Object) => void} [options.onFileSuccess]
 * @param {(fileIndex: number, error: Error) => void} [options.onFileError]
 * @returns {Promise<Array<{ success: boolean, result?: Object, error?: Error }>>}
 */
export async function uploadMultipleImages(files, options = {}) {
  const fileArray = Array.from(files || []);
  if (!fileArray.length) return [];

  const concurrency = Math.max(1, options.concurrency || 3);
  const results = new Array(fileArray.length);
  const progressMap = new Map();
  let completedCount = 0;

  function updateOverallProgress() {
    if (typeof options.onOverallProgress !== "function") return;
    let totalLoaded = 0;
    let totalBytes = 0;

    fileArray.forEach((file, idx) => {
      const fileBytes = file.size || 1;
      totalBytes += fileBytes;
      const fileLoaded = progressMap.get(idx) || 0;
      totalLoaded += fileLoaded;
    });

    const percent = totalBytes > 0 ? Math.min(100, Math.round((totalLoaded / totalBytes) * 100)) : 0;
    options.onOverallProgress({
      loaded: totalLoaded,
      total: totalBytes,
      percent,
      completedCount,
    });
  }

  // Worker queue for concurrency
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < fileArray.length) {
      const currentIndex = nextIndex++;
      const currentFile = fileArray[currentIndex];

      try {
        const result = await uploadImage(currentFile, {
          ...options,
          onProgress: (p) => {
            progressMap.set(currentIndex, p.loaded);
            updateOverallProgress();
            if (typeof options.onFileProgress === "function") {
              options.onFileProgress(currentIndex, p);
            }
          },
        });

        results[currentIndex] = { success: true, result };
        if (typeof options.onFileSuccess === "function") {
          options.onFileSuccess(currentIndex, result);
        }
      } catch (err) {
        results[currentIndex] = { success: false, error: err };
        if (typeof options.onFileError === "function") {
          options.onFileError(currentIndex, err);
        }
      } finally {
        completedCount++;
        progressMap.set(currentIndex, currentFile.size || 1);
        updateOverallProgress();
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, fileArray.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Generate an optimized Cloudinary delivery URL with transformations.
 *
 * @param {string} publicIdOrUrl - The Cloudinary public_id or existing Cloudinary secure URL
 * @param {Object} [transformations] - Transformation parameters
 * @param {number} [transformations.width] - Target width
 * @param {number} [transformations.height] - Target height
 * @param {"fill"|"thumb"|"fit"|"limit"|"scale"|"pad"|"crop"} [transformations.crop="limit"] - Crop mode
 * @param {string|number} [transformations.quality="auto"] - Quality ("auto", "auto:good", "auto:eco", 80, etc.)
 * @param {string} [transformations.format="auto"] - Format ("auto", "webp", "avif", "jpg", "png")
 * @param {string} [transformations.gravity="auto"] - Focus point ("auto", "face", "center")
 * @param {number} [transformations.radius] - Corner radius (e.g. 20, or "max" for circular)
 * @param {string} [transformations.effect] - Optional effects ("sharpen", "blur:200", etc.)
 * @param {string} [transformations.cloudName] - Optional override cloud name
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(publicIdOrUrl, transformations = {}) {
  if (!publicIdOrUrl) return "";

  const cloudName = transformations.cloudName || activeConfig.cloudName;
  const {
    width,
    height,
    crop = width && height ? "fill" : "limit",
    quality = "auto",
    format = "auto",
    gravity,
    radius,
    effect,
  } = transformations;

  const parts = [];
  if (crop) parts.push(`c_${crop}`);
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (quality) parts.push(`q_${quality}`);
  if (format) parts.push(`f_${format}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (radius) parts.push(`r_${radius}`);
  if (effect) parts.push(`e_${effect}`);

  const transformString = parts.join(",");

  // Case 1: If input is already a Cloudinary URL
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    const uploadIndex = publicIdOrUrl.indexOf("/upload/");
    if (uploadIndex !== -1 && transformString) {
      return (
        publicIdOrUrl.slice(0, uploadIndex + 8) +
        transformString +
        "/" +
        publicIdOrUrl.slice(uploadIndex + 8)
      );
    }
    return publicIdOrUrl;
  }

  // Case 2: If input is a regular external URL or path
  if (publicIdOrUrl.startsWith("http://") || publicIdOrUrl.startsWith("https://") || publicIdOrUrl.startsWith("/")) {
    return publicIdOrUrl;
  }

  // Case 3: Public ID
  if (!cloudName) return publicIdOrUrl;
  const transformPath = transformString ? `${transformString}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformPath}${publicIdOrUrl}`;
}

/**
 * Format Cloudinary error responses into actionable messages.
 */
function formatCloudinaryError(body, status, preset, cloudName) {
  const rawMsg = body?.error?.message || "";

  if (rawMsg.toLowerCase().includes("upload preset not found")) {
    return `Cloudinary preset "${preset}" not found. Go to Cloudinary Console > Settings > Upload > Upload Presets and verify the preset name.`;
  }
  if (rawMsg.toLowerCase().includes("unsigned") || rawMsg.toLowerCase().includes("whitelisted")) {
    return `Cloudinary preset "${preset}" must be Unsigned. Go to Cloudinary Console > Settings > Upload > Edit Preset and set "Signing Mode" to "Unsigned".`;
  }
  if (rawMsg.toLowerCase().includes("unknown cloud") || status === 404) {
    return `Cloudinary cloud name "${cloudName}" was not found or is invalid.`;
  }
  if (rawMsg.toLowerCase().includes("file size")) {
    return `The uploaded file exceeds Cloudinary's size limit.`;
  }

  return rawMsg || `Upload failed with status ${status}.`;
}

export default {
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
  isCloudinaryConfigured,
  configureCloudinary,
  resetCloudinaryConfig,
  getOptimizedImageUrl,
};
