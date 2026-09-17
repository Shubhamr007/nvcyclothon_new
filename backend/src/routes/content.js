const express = require("express");
const fs = require("fs");
const { resolveProfileImage } = require("../services/profileMedia");

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

  router.get("/sponsorship-tiers", async (_req, res) => {
    res.json(await repository.listPublicSponsorshipTiers());
  });

  router.get("/settings", async (_req, res) => {
    const settings = await repository.getSiteSettings();
    res.set("Cache-Control", "public, max-age=30");
    res.json(settings);
  });

  router.get("/profile-media/:key", (req, res) => {
    const filePath = resolveProfileImage(config, req.params.key);
    if (!filePath) return res.status(404).json({ detail: "Image not found" });
    res.type("image/webp").send(fs.readFileSync(filePath));
  });

  return router;
}

module.exports = {
  createContentRouter,
};
