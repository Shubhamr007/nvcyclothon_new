#!/usr/bin/env node
"use strict";

const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const esbuild = require("esbuild");

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");
const ASSETS_SRC = path.join(ROOT_DIR, "assets");
const ASSETS_DIST = path.join(DIST_DIR, "assets");

async function build() {
  const startTime = Date.now();
  console.log("\n📦 Building NV Cyclothon Node Backend for Production...\n");

  // 1. Ensure clean dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 2. Bundle with esbuild
  const entryPoints = [
    { in: path.join(ROOT_DIR, "src", "server.js"), out: "server" },
    { in: path.join(ROOT_DIR, "src", "initDb.js"), out: "initDb" },
  ];

  const buildResult = await esbuild.build({
    entryPoints,
    outdir: DIST_DIR,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    packages: "external",
    sourcemap: true,
    logLevel: "info",
    metafile: true,
  });

  // 3. Ensure assets are synced to dist/assets
  if (fs.existsSync(ASSETS_SRC)) {
    fs.cpSync(ASSETS_SRC, ASSETS_DIST, { recursive: true });
  }

  // 4. Verify syntax of generated bundles
  const builtFiles = ["server.js", "initDb.js"];
  for (const file of builtFiles) {
    const filePath = path.join(DIST_DIR, file);
    try {
      execFileSync(process.execPath, ["--check", filePath], { stdio: "pipe" });
    } catch (err) {
      console.error(`❌ Syntax verification failed for ${file}:`, err.message);
      process.exit(1);
    }
  }

  // 5. Output summary
  console.log("--------------------------------------------------");
  for (const file of builtFiles) {
    const filePath = path.join(DIST_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.log(`  ✓ dist/${file.padEnd(12)} ${sizeKb.padStart(8)} kB`);
  }
  if (fs.existsSync(ASSETS_DIST)) {
    const assetFiles = fs.readdirSync(ASSETS_DIST);
    console.log(`  ✓ dist/assets/   (${assetFiles.length} template assets synced)`);
  }
  console.log("--------------------------------------------------");
  const elapsed = Date.now() - startTime;
  console.log(`✨ Backend build completed successfully in ${elapsed}ms\n`);
}

build().catch((err) => {
  console.error("❌ Backend build failed:", err);
  process.exit(1);
});
