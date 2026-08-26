const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const {
  UnsupportedMediaTypeError,
  TooLargeError,
  ValidationError,
} = require("../errors");

const CONTENT_TYPES = {
  csv: ["text/csv", "application/csv", "application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pdf: ["application/pdf"],
};

function safeName(name) {
  return (
    String(name || "upload")
      .split("/")
      .pop()
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .slice(0, 120) || "upload"
  );
}

function validateUpload(file, config) {
  const filename = safeName(file.originalname || "upload");
  const extension = path.extname(filename).slice(1).toLowerCase();
  const allowed = new Set(config.allowedUploadExtensions.map((item) => item.toLowerCase()));

  if (!allowed.has(extension) || !Object.prototype.hasOwnProperty.call(CONTENT_TYPES, extension)) {
    throw new UnsupportedMediaTypeError("This file type is not permitted");
  }
  if (!CONTENT_TYPES[extension].includes(file.mimetype)) {
    throw new UnsupportedMediaTypeError("File content type does not match its extension");
  }

  const content = file.buffer;
  if (extension === "pdf" && !content.slice(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new UnsupportedMediaTypeError("Invalid PDF file");
  }
  if (
    extension === "xlsx" &&
    !content.slice(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  ) {
    throw new UnsupportedMediaTypeError("Invalid spreadsheet file");
  }
  if (extension === "csv" && content.includes(0x00)) {
    throw new UnsupportedMediaTypeError("Invalid CSV file");
  }

  return { filename, extension };
}

function runMulter(upload, req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, (error) => {
      if (!error) {
        resolve();
        return;
      }
      if (error.code === "LIMIT_FILE_SIZE") {
        reject(new TooLargeError("Uploaded file exceeds the 25 MB limit"));
        return;
      }
      reject(error);
    });
  });
}

function createUploadHandler({ config, repository }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.maxUploadSizeBytes,
      files: config.maxFilesPerUpload,
    },
  }).array("files", config.maxFilesPerUpload);

  return async (req, res) => {
    await runMulter(upload, req, res);
    const files = req.files || [];
    if (!files.length || files.length > config.maxFilesPerUpload) {
      throw new ValidationError(`Upload 1 to ${config.maxFilesPerUpload} files`);
    }

    const created = [];
    for (const file of files) {
      const { filename } = validateUpload(file, config);
      if (file.size > config.maxUploadSizeBytes) {
        throw new TooLargeError(`${filename} exceeds the 25 MB limit`);
      }

      const storageKey = `${crypto.randomUUID().replaceAll("-", "")}_${filename}`;
      fs.writeFileSync(path.join(config.uploadDir, storageKey), file.buffer);
      const record = await repository.createUploadRecord({
        original_name: filename,
        storage_key: storageKey,
        content_type: file.mimetype,
        size_bytes: file.size,
      });

      created.push({
        id: record.id,
        original_name: record.original_name,
        size_bytes: record.size_bytes,
        created_at: record.created_at,
      });
    }

    res.status(201).json(created);
  };
}

function createUploadsRouter({ config, repository }) {
  const router = express.Router();
  const handler = createUploadHandler({ config, repository });
  router.post("/", handler);
  return { router, handler };
}

module.exports = {
  createUploadsRouter,
};
