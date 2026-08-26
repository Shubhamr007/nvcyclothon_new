const express = require("express");
const { NotFoundError } = require("../errors");
const {
  parseSchema,
  productCreateSchema,
  productUpdateSchema,
  normalizeProductInput,
  normalizeProductUpdateInput,
} = require("../services/validation");

function createProductsRouter({ config, repository }) {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    const products = await repository.listProducts();
    res.json(products);
  });

  router.get("/:slug", async (req, res) => {
    const product = await repository.getProductBySlug(req.params.slug);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.json(product);
  });

  router.post("/", async (req, res) => {
    const payload = normalizeProductInput(parseSchema(productCreateSchema, req.body));
    const product = await repository.createProduct(payload);
    res.status(201).json(product);
  });

  router.patch("/:slug", async (req, res) => {
    const patch = normalizeProductUpdateInput(parseSchema(productUpdateSchema, req.body));
    const product = await repository.updateProductBySlug(req.params.slug, patch);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    res.json(product);
  });

  router.delete("/:slug", async (req, res) => {
    const deleted = await repository.deleteProductBySlug(req.params.slug);
    if (!deleted) {
      throw new NotFoundError("Product not found");
    }
    res.status(204).send();
  });

  return router;
}

module.exports = {
  createProductsRouter,
};
