const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { ApiError, NotFoundError, ValidationError } = require('../errors');
const { parseSchema, vendorApplicationSchema, paymentVerifySchema, normalizeVendorApplicationInput, VENDOR_CATEGORIES } = require('../services/validation');
const { createPartnerVendorMediaService } = require('../services/partnerVendorMedia');

function createVendorsRouter({ config, repository, emailService, razorpayService, rateLimiter }) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
    fileFilter(_req, file, cb) {
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ValidationError('Only PDF, PNG, JPG, JPEG, and WebP documents are accepted.'));
      }
    },
  }).single('document');

  function runMulter(req, res) {
    return new Promise((resolve, reject) => {
      upload(req, res, (error) => {
        if (!error) return resolve();
        if (error.code === 'LIMIT_FILE_SIZE') {
          return reject(new ValidationError('The uploaded document exceeds the 10MB limit.'));
        }
        reject(error);
      });
    });
  }

  // Get official vendor categories
  router.get('/categories', (_req, res) => {
    res.json(VENDOR_CATEGORIES);
  });

  // Submit vendor application
  router.post(
    '/applications',
    rateLimiter.middleware('vendor_application', 10, 3600, 'Too many application attempts. Try again later.'),
    async (req, res, next) => {
      try {
        await runMulter(req, res);
        const parsed = parseSchema(vendorApplicationSchema, req.body);
        const payload = normalizeVendorApplicationInput(parsed);

        if (req.file) {
          const mediaService = createPartnerVendorMediaService(config);
          const savedMedia = await mediaService.saveVendorDocument(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );
          payload.document_key = savedMedia.key;
          payload.document_content_type = savedMedia.content_type;
          payload.document_size_bytes = savedMedia.size_bytes;
        }

        payload.stall_fee_paise = 0;

        const application = await repository.createVendorApplication(payload);

        // Send confirmation email
        void emailService.sendVendorApplicationConfirmation(application).catch((err) => {
          console.error('Failed to send vendor confirmation email:', err?.message);
        });

        res.status(201).json({
          success: true,
          application,
          reference_number: application.application_number,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Lookup vendor application by reference number or ID
  router.get('/applications/:ref', async (req, res, next) => {
    try {
      const ref = req.params.ref;
      let application = null;
      if (/^NV-26-V-/i.test(ref)) {
        application = await repository.getVendorApplicationByNumber(ref.toUpperCase());
      } else if (/^\d+$/.test(ref)) {
        application = await repository.getVendorApplicationById(Number(ref));
      }
      if (!application) throw new NotFoundError('Vendor application not found');

      res.json({
        id: application.id,
        application_number: application.application_number,
        business_name: application.business_name,
        category: application.category,
        status: application.status,
        created_at: application.created_at,
      });
    } catch (error) {
      next(error);
    }
  });

  // Optional vendor payment verification
  router.post('/applications/:id/payment/verify', async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        throw new ValidationError('Invalid application id');
      }

      const payload = parseSchema(paymentVerifySchema, req.body);
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== payload.razorpay_signature) {
        throw new ValidationError('Payment signature verification failed.');
      }

      const application = await repository.verifyVendorPayment(id, {
        paymentId: payload.razorpay_payment_id,
        signature: payload.razorpay_signature,
      });

      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createVendorsRouter };
