const express = require("express");
const fs = require("fs");
const { resolveProfileImage } = require("../services/profileMedia");
const { parseSchema, visitorEventSchema } = require("../services/validation");

function createContentRouter({ repository, config }) {
  const router = express.Router();

  router.get("/offers", async (_req, res) => {
    const offers = await repository.listPublicOffers();
    res.json(offers);
  });

  router.get("/chief-guests", async (_req, res) => {
    const guests = await repository.listPublicChiefGuests();
    res.json(guests);
  });

  router.get("/organizing-members", async (_req, res) => {
    const members = await repository.listPublicOrganizingMembers();
    res.json(members);
  });

  router.get("/gallery", async (_req, res) => {
    const items = await repository.listPublicGalleryItems();
    res.json(items);
  });

  router.get("/sponsorship-tiers", async (_req, res) => {
    res.json(await repository.listPublicSponsorshipTiers());
  });

  router.get("/settings", async (_req, res) => {
    const settings = await repository.getSiteSettings();
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(settings);
  });

  router.post("/visits", async (req, res) => {
    await repository.recordPageVisit(parseSchema(visitorEventSchema, req.body || {}));
    res.status(204).end();
  });

  router.get("/profile-media/:key", (req, res, next) => {
    const filePath = resolveProfileImage(config, req.params.key);
    if (!filePath) return res.status(404).json({ detail: "Image not found" });
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.type("image/webp").sendFile(filePath, (err) => {
      if (err && !res.headersSent) next(err);
    });
  });

  return router;
}

module.exports = {
  createContentRouter,
};
