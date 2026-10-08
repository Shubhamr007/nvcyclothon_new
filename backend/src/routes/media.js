"use strict";

const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  ValidationError,
  TooLargeError,
  UnsupportedMediaTypeError,
  NotFoundError,
  ApiError,
} = require("../errors");
const { MAX_IMAGE_BYTES } = require("../services/storage");

const SAFE_FOLDER_PATTERN = /^[a-zA-Z0-9_-]{1,50}$/;

function createMediaRouter({ config, storageService, rateLimiter }) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_IMAGE_BYTES,
      files: 1,
    },
  }).single("file");

  function runUploadMulter(req, res) {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (!err) {
          // Check if field was sent as "image" instead of "file"
          if (!req.file && req.body && req.files && req.files.image) {
            req.file = req.files.image[0];
          }
          return resolve();
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return reject(new TooLargeError("Uploaded image exceeds the 10 MB limit"));
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          // If uploaded under alternate field name like "image"
          const altUpload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
          }).single("image");
          return altUpload(req, res, (altErr) => {
            if (!altErr) return resolve();
            if (altErr.code === "LIMIT_FILE_SIZE") {
              return reject(new TooLargeError("Uploaded image exceeds the 10 MB limit"));
            }
            return reject(altErr);
          });
        }
        reject(err);
      });
    });
  }

  // 1. Upload Router: POST /api/uploads/image
  const uploadRouter = express.Router();

  uploadRouter.post("/", async (req, res, next) => {
    try {
      const clientIp = req.ip || req.connection?.remoteAddress || "unknown";

      if (rateLimiter) {
        rateLimiter.check({
          scope: "media_upload",
          key: clientIp,
          maximum: 30,
          seconds: 900,
          message: "Too many upload attempts. Please try again in 15 minutes.",
        });
      }

      await runUploadMulter(req, res);

      const file = req.file;
      if (!file || !file.buffer) {
        throw new ValidationError("No image file provided for upload");
      }

      let folder = "media";
      const requestedFolder = String(req.body?.folder || req.query?.folder || "").trim();
      if (requestedFolder) {
        // Strip trailing and leading slashes
        const cleanFolder = requestedFolder.replace(/^\/+|\/+$/g, "");
        if (SAFE_FOLDER_PATTERN.test(cleanFolder)) {
          folder = cleanFolder;
        }
      }

      const saved = await storageService.saveImage(file.buffer, file.mimetype, {
        folder,
      });

      res.status(201).json({
        success: true,
        url: saved.url,
        secureUrl: saved.url,
        secure_url: saved.url,
        key: saved.key,
        publicId: saved.key,
        format: saved.content_type === "image/svg+xml" ? "svg" : "webp",
        size_bytes: saved.size_bytes,
        bytes: saved.size_bytes,
        width: saved.width || null,
        height: saved.height || null,
      });
    } catch (error) {
      next(error);
    }
  });

  // 2. Delivery Router: GET /api/media/*
  const deliveryRouter = express.Router();

  deliveryRouter.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    try {
      const requestedKey = decodeURIComponent(req.path.replace(/^\/+/, ""));
      if (!requestedKey) {
        throw new NotFoundError("File not found");
      }

      const filePath = storageService.resolveFilePath(requestedKey);
      if (!filePath) {
        throw new NotFoundError("File not found");
      }

      // HTTP Caching Headers: Immutable 1-year cache for high performance
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Content-Type-Options", "nosniff");
      // Relax CSP from default-src 'none' so browsers can safely render images
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' blob: data:; img-src 'self' data: blob:; style-src 'unsafe-inline'; sandbox allow-scripts=false"
      );

      res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return {
    uploadRouter,
    deliveryRouter,
  };
}

module.exports = {
  createMediaRouter,
};
