// functions/routes/assets.js
import { Router } from "express";
import { MAX_PARALLEL_GENERATIONS } from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";

const router = Router();

/* ---------- Inline SVG logo (fallback) ---------- */
router.get("/images/app-logo.svg", (_req, res) => {
  res.type("image/svg+xml").send(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="#fff" aria-label="Sequence Five Logo" role="img">
  <path d="M188.42 274.96a3.14 3.14 0 0 0-.23-4.34c-.39-.31-.85-.62-1.4-.7l-67.49-21.95c-2.33-.78-3.65-3.26-2.87-5.66l19.7-60.74c.78-2.33 3.26-3.65 5.66-2.87h0l7.52 2.4-21.95-96.35-17.3-10.39c-53.67 42.58-84.93 107.2-85.08 175.7v.47c0 3.8.08 7.6.31 11.4v.31c.85 16.52 3.57 32.89 8.07 48.79l120.86 11.09 34.21-47.09h0v-.08zM391.51 75.67l-105.03 63.07v58.72c-.16 1.71 1.09 3.18 2.72 3.34.54 0 1.01 0 1.55-.23l67.49-21.95c2.33-.78 4.89.54 5.66 2.87h0l19.7 60.74c.78 2.33-.54 4.89-2.87 5.66l-7.21 2.33 74.08 64.54 18.54-1.71c4.81-16.76 7.68-33.98 8.61-51.35v-.54c.16-3.57.23-7.21.23-10.78v-.47a224.59 224.59 0 0 0-83.39-174.38l-.08.16zM252.65 317.86c-.85-1.47-2.72-1.94-4.19-1.09-.47.23-.85.62-1.09 1.09l-41.73 57.4c-1.47 2.02-4.27 2.48-6.28 1.01h0l-51.66-37.55c-2.02-1.47-2.48-4.27-1.01-6.28h0l4.73-6.59-98.05-9-14.2 12.33c30.8 82.46 108.45 141.96 200.6 146.07l47.16-110.23-34.29-47.16zm60.51-47.94c-1.63.39-2.72 2.02-2.33 3.72.08.47.31.93.7 1.32l41.73 57.4c1.47 2.02 1.01 4.81-1.01 6.28h0l-51.66 37.55c-2.02 1.47-4.81 1.01-6.28-1.01h0l-4.65-6.44-38.55 90.29 6.98 16.29c92.31-3.26 170.51-62.21 202-144.29l-91.07-79.36-55.77 18.15-.08.08zm-103.87-69.28c1.55.7 3.34 0 4.03-1.63.23-.47.31-1.01.23-1.55v-70.98a4.51 4.51 0 0 1 4.5-4.5h63.92a4.51 4.51 0 0 1 4.5 4.5v7.6l84.48-50.73 4.5-19.63c-75.17-50.5-173.38-50.97-249.01-1.16l27.38 120.01 55.54 18h0l-.08.08z"/>
</svg>
  `.trim());
});

// Quiet favicon
router.get("/favicon.ico", (_req, res) => res.status(204).end());

/* ---------- Client bundles (served as static strings) ---------- */
async function readAsset(relPath) {
  const p = path.join(process.cwd(), "functions", "client", relPath);
  return fs.readFile(p, "utf8");
}

// Gallery bundle
router.get("/assets/gallery.js", async (_req, res) => {
  const code = await readAsset("gallery.js");
  res.type("application/javascript").send(code);
});

// Generator bundle (injects MAX_PARALLEL_GENERATIONS)
router.get("/assets/generator.js", async (_req, res) => {
  const raw = await readAsset("generator.js");
  const code = raw.replace("__MAX_PARALLEL__", String(Number(MAX_PARALLEL_GENERATIONS || 5)));
  res.type("application/javascript").send(code);
});

// Dashboard bundle
router.get("/assets/dashboard.js", async (_req, res) => {
  const code = await readAsset("dashboard.js");
  res.type("application/javascript").send(code);
});

export default router;
