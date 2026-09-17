"use strict";

const fs = require("fs/promises");
const path = require("path");

const inFlight = new Map();

async function getOrCreatePdf({ rootDirectory, directory, filename, generate }) {
  const filePath = path.join(rootDirectory, directory, filename);
  try {
    const cached = await fs.readFile(filePath);
    if (cached.length > 0) {
      return cached;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  if (inFlight.has(filePath)) {
    return inFlight.get(filePath);
  }

  const generation = (async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const pdf = await generate();
    const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporaryPath, pdf);
    await fs.rename(temporaryPath, filePath);
    return pdf;
  })();

  inFlight.set(filePath, generation);
  try {
    return await generation;
  } finally {
    inFlight.delete(filePath);
  }
}

module.exports = {
  getOrCreatePdf,
};
