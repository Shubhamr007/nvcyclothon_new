const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { ApiError, NotFoundError, ValidationError } = require('../errors');
const { parseSchema, partnerApplicationSchema, paymentVerifySchema, normalizePartnerApplicationInput } = require('../services/validation');
const { createPartnerVendorMediaService } = require('../services/partnerVendorMedia');

function createPartnersRouter({ config, repository, emailService, razorpayService, rateLimiter }) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
    fileFilter(_req, file, cb) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ValidationError('Only PNG, JPG, JPEG, SVG, and WebP logos are accepted.'));
      }
    },
  }).single('logo');

  function runMulter(req, res) {
    return new Promise((resolve, reject) => {
      upload(req, res, (error) => {
        if (!error) return resolve();
        if (error.code === 'LIMIT_FILE_SIZE') {
          return reject(new ValidationError('The uploaded logo exceeds the 5MB limit.'));
        }
        reject(error);
      });
    });
  }

  // List public sponsorship packages/tiers
  router.get(['/tiers', '/packages'], async (_req, res, next) => {
    try {
      const tiers = await repository.listPublicSponsorshipTiers();
      res.json(tiers);
    } catch (error) {
      next(error);
    }
  });

  // List approved partners for the public "Our Partners" section
  router.get('/approved', async (_req, res, next) => {
    try {
      const partners = await repository.listApprovedPartners();
      res.json(partners);
    } catch (error) {
      next(error);
    }
  });

  // Submit partner application (5-step form data with optional logo)
  router.post(
    '/applications',
    rateLimiter.middleware('partner_application', 10, 3600, 'Too many application attempts. Try again later.'),
    async (req, res, next) => {
      try {
        if (req.is('multipart/form-data')) {
          await runMulter(req, res);
        }
        const parsed = parseSchema(partnerApplicationSchema, req.body);
        const payload = normalizePartnerApplicationInput(parsed);

        if (req.body?.logo_url) {
          payload.logo_key = req.body.logo_url;
          payload.logo_content_type = 'image/webp';
        } else if (req.file) {
          const mediaService = createPartnerVendorMediaService(config);
          const savedMedia = await mediaService.savePartnerLogo(req.file.buffer, req.file.mimetype);
          payload.logo_key = savedMedia.key;
          payload.logo_content_type = savedMedia.content_type;
          payload.logo_size_bytes = savedMedia.size_bytes;
        }

        let tier = null;
        if (payload.sponsorship_tier_id) {
          tier = await repository.getSponsorshipTierById(payload.sponsorship_tier_id);
          if (tier) {
            payload.package_name = tier.name;
            payload.application_fee_paise = tier.amount_paise || 0;
          }
        }

        const application = await repository.createPartnerApplication(payload);

        // Send confirmation email with reference number
        void emailService.sendPartnerApplicationConfirmation(application).catch((err) => {
          console.error('Failed to send partner confirmation email:', err?.message);
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

  // Lookup application by reference number or ID
  router.get('/applications/:ref', async (req, res, next) => {
    try {
      const ref = req.params.ref;
      let application = null;
      if (/^NV-26-P-/i.test(ref)) {
        application = await repository.getPartnerApplicationByNumber(ref.toUpperCase());
      } else if (/^\d+$/.test(ref)) {
        application = await repository.getPartnerApplicationById(Number(ref));
      }
      if (!application) throw new NotFoundError('Partner application not found');

      // Return sanitized public status
      res.json({
        id: application.id,
        application_number: application.application_number,
        company_name: application.company_name,
        package_name: application.package_name || application.tier_name,
        status: application.status,
        created_at: application.created_at,
      });
    } catch (error) {
      next(error);
    }
  });

  // Optional payment verification if Razorpay is used
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

      const application = await repository.verifyPartnerPayment(id, {
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

module.exports = { createPartnersRouter };
