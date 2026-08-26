const express = require("express");
const {
  parseSchema,
  orderCreateSchema,
  normalizeOrderInput,
} = require("../services/validation");

function createOrdersRouter({ config, repository, rateLimiter }) {
  const router = express.Router();

  router.post(
    "/",
    rateLimiter.middleware(
      "order",
      10,
      3600,
      "Too many order attempts. Try again later."
    ),
    async (req, res) => {
      const payload = normalizeOrderInput(parseSchema(orderCreateSchema, req.body));
      const order = await repository.createOrder(payload);
      res.status(201).json(order);
    }
  );

  return router;
}

module.exports = {
  createOrdersRouter,
};
