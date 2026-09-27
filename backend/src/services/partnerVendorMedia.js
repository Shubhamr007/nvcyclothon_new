const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const PARTNER_LOGO_DIR = 'partner-logos';
const VENDOR_DOC_DIR = 'vendor-docs';
const MAX_LOGO_DIMENSION = 800;
const LOGO_QUALITY = 85;

function createPartnerVendorMediaService(config) {
  function resolveDir(subdir) {
    return path.join(config.uploadDir, subdir);
  }

  async function ensureDir(subdir) {
    await fs.mkdir(resolveDir(subdir), { recursive: true });
  }

  async function savePartnerLogo(buffer, mimetype) {
    await ensureDir(PARTNER_LOGO_DIR);
    const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
    const processed = await sharp(buffer)
      .resize(MAX_LOGO_DIMENSION, MAX_LOGO_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: LOGO_QUALITY })
      .toBuffer();
    const filePath = path.join(resolveDir(PARTNER_LOGO_DIR), key);
    await fs.writeFile(filePath, processed);
    return {
      key: `${PARTNER_LOGO_DIR}/${key}`,
      content_type: 'image/webp',
      size_bytes: processed.length,
    };
  }

  async function saveVendorDocument(buffer, originalName, mimetype) {
    await ensureDir(VENDOR_DOC_DIR);
    const ext = path.extname(originalName) || '.pdf';
    const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(resolveDir(VENDOR_DOC_DIR), key);
    await fs.writeFile(filePath, buffer);
    return {
      key: `${VENDOR_DOC_DIR}/${key}`,
      content_type: mimetype || 'application/octet-stream',
      size_bytes: buffer.length,
    };
  }

  function getFilePath(key) {
    return path.join(config.uploadDir, key);
  }

  return {
    savePartnerLogo,
    saveVendorDocument,
    getFilePath,
  };
}

module.exports = { createPartnerVendorMediaService };
