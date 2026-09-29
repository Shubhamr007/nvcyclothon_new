"use strict";

/**
 * Backend Cloudinary Unsigned Upload Service
 *
 * Allows uploading image buffers or data directly to Cloudinary using an
 * unsigned upload preset without requiring an API Secret.
 */

function createCloudinaryService(config = {}) {
  const cloudName = config.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = config.cloudinaryUploadPreset || process.env.CLOUDINARY_UPLOAD_PRESET || "";
  const defaultFolder = config.cloudinaryFolder || process.env.CLOUDINARY_FOLDER || "nvcyclothon";

  /**
   * Check if Cloudinary credentials are configured.
   */
  function isConfigured() {
    return Boolean(cloudName && uploadPreset);
  }

  /**
   * Upload an image buffer or base64 data to Cloudinary using unsigned upload.
   *
   * @param {Buffer|Blob|string} fileInput - Buffer, Blob, base64 data URI, or URL
   * @param {Object} [options]
   * @param {string} [options.filename] - Original filename (e.g. "photo.jpg")
   * @param {string} [options.mimetype] - Content-Type (e.g. "image/jpeg")
   * @param {string} [options.folder] - Target Cloudinary folder
   * @param {string|string[]} [options.tags] - Optional tags
   * @param {string} [options.publicId] - Optional public ID
   * @param {string} [options.resourceType="image"] - Resource type ("image", "auto", "raw")
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
   *   raw: Object
   * }>}
   */
  async function uploadImage(fileInput, options = {}) {
    const activeCloud = options.cloudName || cloudName;
    const activePreset = options.uploadPreset || uploadPreset;
    const folder = options.folder !== undefined ? options.folder : defaultFolder;
    const resourceType = options.resourceType || "image";

    if (!activeCloud || !activePreset) {
      throw new Error(
        "Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const formData = new FormData();

    // Prepare payload
    if (Buffer.isBuffer(fileInput)) {
      const mimetype = options.mimetype || "image/jpeg";
      const filename = options.filename || "upload.jpg";
      const blob = new Blob([fileInput], { type: mimetype });
      formData.append("file", blob, filename);
    } else {
      formData.append("file", fileInput);
    }

    formData.append("upload_preset", activePreset);

    if (folder) {
      formData.append("folder", folder);
    }

    if (options.tags) {
      const tagsString = Array.isArray(options.tags) ? options.tags.join(",") : options.tags;
      formData.append("tags", tagsString);
    }

    if (options.publicId) {
      formData.append("public_id", options.publicId);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(activeCloud)}/${encodeURIComponent(resourceType)}/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg =
        responseBody?.error?.message ||
        `Cloudinary upload failed with HTTP status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.raw = responseBody;
      throw error;
    }

    return {
      success: true,
      url: responseBody.secure_url || responseBody.url,
      secureUrl: responseBody.secure_url,
      publicId: responseBody.public_id,
      format: responseBody.format,
      width: responseBody.width,
      height: responseBody.height,
      bytes: responseBody.bytes,
      originalFilename: responseBody.original_filename,
      createdAt: responseBody.created_at,
      resourceType: responseBody.resource_type,
      raw: responseBody,
    };
  }

  /**
   * Helper to construct an optimized Cloudinary delivery URL.
   */
  function getOptimizedImageUrl(publicIdOrUrl, transformations = {}) {
    if (!publicIdOrUrl) return "";
    const activeCloud = transformations.cloudName || cloudName;
    const {
      width,
      height,
      crop = width && height ? "fill" : "limit",
      quality = "auto",
      format = "auto",
      gravity,
    } = transformations;

    const parts = [];
    if (crop) parts.push(`c_${crop}`);
    if (width) parts.push(`w_${width}`);
    if (height) parts.push(`h_${height}`);
    if (quality) parts.push(`q_${quality}`);
    if (format) parts.push(`f_${format}`);
    if (gravity) parts.push(`g_${gravity}`);

    const transformString = parts.join(",");

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

    if (!activeCloud) return publicIdOrUrl;
    const transformPath = transformString ? `${transformString}/` : "";
    return `https://res.cloudinary.com/${activeCloud}/image/upload/${transformPath}${publicIdOrUrl}`;
  }

  return {
    isConfigured,
    uploadImage,
    getOptimizedImageUrl,
  };
}

module.exports = {
  createCloudinaryService,
};
