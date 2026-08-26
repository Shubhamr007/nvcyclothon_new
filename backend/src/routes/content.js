const express = require("express");

function createContentRouter({ repository }) {
  const router = express.Router();

  router.get("/offers", async (_req, res) => {
    const offers = await repository.listPublicOffers();
    res.json(offers);
  });

  router.get("/chief-guests", async (_req, res) => {
    const guests = await repository.listPublicChiefGuests();
    res.json(guests);
  });

  router.get("/settings", async (_req, res) => {
    const settings = await repository.getSiteSettings();
    res.set("Cache-Control", "public, max-age=30");
    res.json(settings);
  });

  return router;
}

module.exports = {
  createContentRouter,
};
