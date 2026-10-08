"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { ValidationError, UnsupportedMediaTypeError, TooLargeError } = require("../errors");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB raw upload limit
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB document limit
const MAX_DIMENSION = 1920;
const OUTPUT_QUALITY = 82;

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);

function ensureSubdir(rootDir, subdir) {
  const target = path.join(rootDir, subdir);
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function generateSafeKey(ext = "webp") {
  const cleanExt = String(ext || "webp").replace(/^\./, "").toLowerCase();
  const timePrefix = Date.now().toString(36);
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return `${timePrefix}-${randomSuffix}.${cleanExt}`;
}

/**
 * Storage Service for NV Cyclothon
 * Handles high-performance WebP compression, image sanitization,
 * document verification, and path traversal protection.
 */
function createStorageService(config) {
  const rootDir = config.uploadDir || path.resolve(__dirname, "../../uploads");

  // Ensure standard upload subdirectories exist
  ensureSubdir(rootDir, "media");
  ensureSubdir(rootDir, "community");
  ensureSubdir(rootDir, "partner-logos");
  ensureSubdir(rootDir, "vendor-docs");
  ensureSubdir(rootDir, "profiles");

  async function saveImage(buffer, originalMime, options = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new ValidationError("No image buffer provided");
    }

    const mime = String(originalMime || "").toLowerCase();
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new UnsupportedMediaTypeError("Only JPEG, PNG, WebP, AVIF, GIF, or SVG images are allowed");
    }

    if (buffer.length > (options.maxBytes || MAX_IMAGE_BYTES)) {
      throw new TooLargeError("Image exceeds the maximum allowed size limit");
    }

    const folder = options.folder || "media";
    ensureSubdir(rootDir, folder);

    // If SVG, sanitize and store directly (Sharp does not transcode vector to WebP by default without rasterization)
    if (mime === "image/svg+xml") {
      const svgText = buffer.toString("utf8");
      // Basic SVG sanitization against script tags and event handlers
      if (/<script[\s>]/i.test(svgText) || /on\w+\s*=/i.test(svgText) || /javascript:/i.test(svgText)) {
        throw new ValidationError("SVG file contains prohibited embedded scripts or event handlers");
      }
      const key = generateSafeKey("svg");
      const relativePath = path.join(folder, key);
      const fullPath = path.join(rootDir, relativePath);
      fs.writeFileSync(fullPath, buffer);
      return {
        key: relativePath,
        url: `/api/media/${relativePath}`,
        content_type: "image/svg+xml",
        size_bytes: buffer.length,
      };
    }

    // Process raster image through Sharp: auto-orient, limit pixels, resize, re-encode to WebP
    try {
      const image = sharp(buffer, {
        failOn: "warning",
        limitInputPixels: 268402689, // protects against decompression bombs (~16384x16384)
      });

      const metadata = await image.metadata();
      if (!metadata || !metadata.width || !metadata.height) {
        throw new ValidationError("Uploaded file is not a valid or readable image");
      }

      const quality = options.quality || OUTPUT_QUALITY;
      const maxDim = options.maxDimension || MAX_DIMENSION;

      const processedBuffer = await image
        .rotate() // auto-orient based on EXIF
        .resize({
          width: maxDim,
          height: maxDim,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .withMetadata({ orientation: undefined }) // strip EXIF GPS and camera metadata
        .toBuffer();

      const key = generateSafeKey("webp");
      const relativePath = path.join(folder, key);
      const fullPath = path.join(rootDir, relativePath);

      fs.writeFileSync(fullPath, processedBuffer);

      return {
        key: relativePath,
        url: `/api/media/${relativePath}`,
        content_type: "image/webp",
        size_bytes: processedBuffer.length,
        width: metadata.width,
        height: metadata.height,
      };
    } catch (err) {
      if (err instanceof ValidationError || err instanceof TooLargeError || err instanceof UnsupportedMediaTypeError) {
        throw err;
      }
      throw new ValidationError(`Unable to process image: ${err.message}`);
    }
  }

  async function saveDocument(buffer, originalName, mime, options = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new ValidationError("No document buffer provided");
    }

    if (buffer.length > (options.maxBytes || MAX_DOCUMENT_BYTES)) {
      throw new TooLargeError("Document exceeds the maximum allowed size limit");
    }

    const folder = options.folder || "vendor-docs";
    ensureSubdir(rootDir, folder);

    const ext = path.extname(String(originalName || "")).toLowerCase() || ".pdf";
    // Magic bytes verification
    if (ext === ".pdf" && !buffer.slice(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new UnsupportedMediaTypeError("Invalid PDF document");
    }
    if (ext === ".xlsx" && !buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
      throw new UnsupportedMediaTypeError("Invalid spreadsheet file");
    }
    if (ext === ".csv" && buffer.includes(0x00)) {
      throw new UnsupportedMediaTypeError("Invalid CSV file (contains binary null bytes)");
    }

    const key = generateSafeKey(ext.slice(1));
    const relativePath = path.join(folder, key);
    const fullPath = path.join(rootDir, relativePath);

    fs.writeFileSync(fullPath, buffer);

    return {
      key: relativePath,
      url: `/api/media/${relativePath}`,
      content_type: mime || "application/octet-stream",
      size_bytes: buffer.length,
      original_name: String(originalName || "document").slice(0, 150),
    };
  }

  /**
   * Resolves a media key to an absolute path with strict path traversal protection.
   * Prevents directory escaping via `..` or leading slashes.
   */
  function resolveFilePath(requestedKey) {
    if (!requestedKey) return null;
    const normalized = path.normalize(String(requestedKey)).replace(/^(\.\.(\/|\\|$))+/, "");
    const absoluteTarget = path.resolve(rootDir, normalized);

    // Verify target path starts with rootDir
    if (!absoluteTarget.startsWith(rootDir)) {
      return null;
    }

    if (!fs.existsSync(absoluteTarget)) {
      return null;
    }

    return absoluteTarget;
  }

  function deleteFile(requestedKey) {
    const filePath = resolveFilePath(requestedKey);
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  return {
    rootDir,
    saveImage,
    saveDocument,
    resolveFilePath,
    deleteFile,
  };
}

module.exports = {
  createStorageService,
  MAX_IMAGE_BYTES,
  MAX_DOCUMENT_BYTES,
};
