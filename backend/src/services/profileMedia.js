"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function profileDir(config) {
  return path.join(config.uploadDir, "profiles");
}

async function storeProfileImage(config, file) {
  if (!file || !ALLOWED_MIME.has(String(file.mimetype || "").toLowerCase())) {
    const error = new Error("Only JPEG, PNG, or WebP images are allowed.");
    error.status = 400;
    throw error;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const error = new Error("Profile image exceeds the 5 MB limit.");
    error.status = 413;
    throw error;
  }
  fs.mkdirSync(profileDir(config), { recursive: true });
  const key = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.webp`;
  const output = await sharp(file.buffer)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  fs.writeFileSync(path.join(profileDir(config), key), output, { flag: "wx" });
  return `/api/content/profile-media/${key}`;
}

function resolveProfileImage(config, key) {
  const safeKey = path.basename(String(key || ""));
  if (!safeKey || safeKey.startsWith(".")) return null;
  const target = path.join(profileDir(config), safeKey);
  return fs.existsSync(target) ? target : null;
}

module.exports = { storeProfileImage, resolveProfileImage };