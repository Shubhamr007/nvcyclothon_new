import {
  uploadAdminProfileImage,
  createGalleryBatch,
  adminRequest,
} from "../../../api/http";
import { uploadImage, isCloudinaryConfigured } from "../../../services/cloudinary";

/**
 * Executes a batch upload of photographs with progress updates.
 */
export async function executeBatchPhotoUpload(
  accessToken,
  { batchFiles, batchBaseTitle, batchCategory, onProgress }
) {
  if (!batchFiles || batchFiles.length === 0) return [];
  const createdItems = [];

  try {
    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      onProgress?.({ current: i + 1, total: batchFiles.length });

      let imageUrl = "";
      if (isCloudinaryConfigured()) {
        const uploaded = await uploadImage(file, { folder: "gallery" });
        imageUrl = uploaded.secure_url;
      } else {
        const uploaded = await uploadAdminProfileImage(accessToken, file);
        imageUrl = uploaded.image_url;
      }

      const fileNameClean = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim();

      const title = batchBaseTitle
        ? `${batchBaseTitle} #${i + 1}`
        : fileNameClean.charAt(0).toUpperCase() + fileNameClean.slice(1);

      createdItems.push({
        title,
        category: batchCategory,
        caption: "",
        image_url: imageUrl,
        display_order: i,
        featured: true,
      });
    }

    await createGalleryBatch(accessToken, createdItems);
    return createdItems;
  } catch (err) {
    throw new Error(err.message || "Failed to batch upload photographs.");
  }
}

/**
 * Saves a single photograph (Create or Update).
 */
export async function saveSinglePhoto(accessToken, { singleForm, editingId }) {
  try {
    if (editingId) {
      return await adminRequest(`/gallery/${editingId}`, accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleForm),
      });
    }
    return await adminRequest("/gallery", accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(singleForm),
    });
  } catch (err) {
    throw new Error(err.message || "Failed to save photograph.");
  }
}

/**
 * Deletes a single photograph by ID.
 */
export async function deleteSinglePhoto(accessToken, id) {
  try {
    return await adminRequest(`/gallery/${id}`, accessToken, {
      method: "DELETE",
    });
  } catch (err) {
    throw new Error(err.message || "Failed to delete photograph.");
  }
}
