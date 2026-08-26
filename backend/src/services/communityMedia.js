const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const OUTPUT_QUALITY = 82;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function communityDir(config) {
  return path.join(config.uploadDir, "community");
}

function ensureDir(config) {
  fs.mkdirSync(communityDir(config), { recursive: true });
}

function isImageMimeAllowed(mime) {
  return ALLOWED_MIME.has(String(mime || "").toLowerCase());
}

async function processAndStoreCommunityImage(config, file) {
  if (!file) return null;
  if (!isImageMimeAllowed(file.mimetype)) {
    const err = new Error("Only JPEG, PNG, or WebP images are allowed.");
    err.status = 400;
    throw err;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const err = new Error("Image exceeds the 5 MB size limit.");
    err.status = 413;
    throw err;
  }

  ensureDir(config);

  const buffer = file.buffer;
  const image = sharp(buffer, { failOn: "warning" });
  const metadata = await image.metadata();
  if (!metadata || !metadata.width || !metadata.height) {
    const err = new Error("The uploaded file is not a valid image.");
    err.status = 400;
    throw err;
  }

  const filename = `${Date.now().toString(36)}-${crypto
    .randomBytes(6)
    .toString("hex")}.webp`;
  const target = path.join(communityDir(config), filename);

  const finalBuffer = await image
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: OUTPUT_QUALITY })
    .withMetadata({ orientation: undefined })
    .toBuffer();

  fs.writeFileSync(target, finalBuffer);

  return {
    image_key: filename,
    image_content_type: "image/webp",
    image_size_bytes: finalBuffer.length,
  };
}

function resolveCommunityImagePath(config, key) {
  const safeKey = path.basename(String(key || ""));
  if (!safeKey || safeKey === "." || safeKey.startsWith("..")) {
    return null;
  }
  const target = path.join(communityDir(config), safeKey);
  if (!fs.existsSync(target)) return null;
  return target;
}

function deleteCommunityImage(config, key) {
  const target = resolveCommunityImagePath(config, key);
  if (target) {
    try {
      fs.unlinkSync(target);
    } catch {
      // best effort — file may already be gone
    }
  }
}

module.exports = {
  MAX_IMAGE_BYTES,
  ALLOWED_MIME,
  isImageMimeAllowed,
  processAndStoreCommunityImage,
  resolveCommunityImagePath,
  deleteCommunityImage,
  communityDir,
};
