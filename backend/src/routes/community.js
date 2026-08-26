const express = require("express");
const multer = require("multer");
const { ApiError, ValidationError } = require("../errors");
const {
  parseSchema,
  communityPostSchema,
} = require("../services/validation");
const {
  MAX_IMAGE_BYTES,
  processAndStoreCommunityImage,
  resolveCommunityImagePath,
} = require("../services/communityMedia");

function toPublicPost(record) {
  return {
    id: record.id,
    name: record.name,
    message: record.message,
    image_url: record.image_key ? `/api/community/media/${record.image_key}` : null,
    created_at: record.created_at,
    approved_at: record.moderated_at,
  };
}

function requestKey(req) {
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function createCommunityRouter({ config, repository, rateLimiter, emailService, logger }) {
  const router = express.Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  }).single("image");

  router.get("/posts", async (_req, res) => {
    const [settings, approvedPosts, approvedCount] = await Promise.all([
      repository.getSiteSettings(),
      repository.listApprovedCommunityPosts(60),
      repository.countApprovedCommunityPosts(),
    ]);
    const enabled = settings.sections?.community !== false;
    res.set("Cache-Control", "public, max-age=30");
    res.json({
      enabled,
      total_approved: approvedCount,
      items: enabled ? approvedPosts.map(toPublicPost) : [],
    });
  });

  router.get("/media/:key", async (req, res, next) => {
    try {
      const post = await findPostByImageKey(repository, req.params.key);
      if (!post || post.status !== "approved") {
        throw new ApiError(404, "Media not found");
      }
      const target = resolveCommunityImagePath(config, req.params.key);
      if (!target) {
        throw new ApiError(404, "Media not found");
      }
      res.set("Cache-Control", "public, max-age=3600, immutable");
      res.type(post.image_content_type || "image/webp").sendFile(target);
    } catch (error) {
      next(error);
    }
  });

  router.post("/posts", (req, res, next) => {
    upload(req, res, async (uploadError) => {
      try {
        if (uploadError) {
          if (uploadError.code === "LIMIT_FILE_SIZE") {
            throw new ApiError(413, "Image exceeds the 5 MB size limit.");
          }
          throw uploadError;
        }

        const settings = await repository.getSiteSettings();
        if (settings.sections?.community === false) {
          throw new ApiError(403, "Community submissions are currently closed.");
        }

        rateLimiter.check({
          scope: "community-post",
          key: requestKey(req),
          maximum: 3,
          seconds: 24 * 60 * 60,
          message: "You have reached the daily community post limit. Try again tomorrow.",
        });

        const payload = parseSchema(communityPostSchema, {
          name: req.body?.name,
          message: req.body?.message,
          consent_accepted: req.body?.consent_accepted,
        });
        if (!payload.consent_accepted) {
          throw new ValidationError(
            "Please confirm the consent statement before submitting."
          );
        }

        const imageDetails = await processAndStoreCommunityImage(config, req.file);

        const record = await repository.createCommunityPost({
          name: payload.name,
          message: payload.message,
          image_key: imageDetails?.image_key || null,
          image_content_type: imageDetails?.image_content_type || null,
          image_size_bytes: imageDetails?.image_size_bytes || null,
          submitted_ip: requestKey(req),
          submitted_user_agent: String(req.headers["user-agent"] || "").slice(0, 240),
        });

        notifyModerators({ config, emailService, logger, record }).catch((error) => {
          (logger || console).error?.("community notify failed", error);
        });

        res.status(201).json({
          status: "pending_review",
          id: record.id,
        });
      } catch (error) {
        if (error?.status === 400 || error?.status === 413) {
          next(new ApiError(error.status, error.message));
          return;
        }
        next(error);
      }
    });
  });

  return router;
}

async function findPostByImageKey(repository, key) {
  const safeKey = String(key || "");
  if (!safeKey) return null;
  const approved = await repository.listApprovedCommunityPosts(200);
  return approved.find((post) => post.image_key === safeKey) || null;
}

let lastNotificationTs = 0;
async function notifyModerators({ config, emailService, logger, record }) {
  if (!config.emailEnabled || !config.communityModeratorEmails?.length) {
    return;
  }
  const now = Date.now();
  if (now - lastNotificationTs < 10 * 60 * 1000) {
    return;
  }
  lastNotificationTs = now;
  const subject = "[NV Cyclothon] New community wall submission pending review";
  const message =
    `A new community wall post from ${record.name} is awaiting moderation.\n\n` +
    `Message: ${record.message}\n\n` +
    `Log in to the admin dashboard to approve or reject.`;
  try {
    await emailService.sendEventUpdate({
      recipients: config.communityModeratorEmails,
      subject,
      message,
    });
  } catch (error) {
    (logger || console).error?.("community email fail", error);
  }
}

module.exports = {
  createCommunityRouter,
};
