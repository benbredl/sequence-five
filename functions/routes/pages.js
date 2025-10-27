// functions/routes/pages.js
import { Router } from "express";
import { HTML as ImageGeneratorHTML } from "../views/image-generator.js";
import { HTML as ArchiveHTML } from "../views/archive.js";
import { HTML as StoryboardsHTML } from "../views/storyboards.js";
import { HTML as StoryboardHTML } from "../views/storyboard.js";
import { HTML as UsageHTML } from "../views/usage.js";
import { HTML as LoginHTML } from "../views/login.js"; // ← NEW

const router = Router();

router.get("/", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(ImageGeneratorHTML);
});
router.get("/image-generator", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(ImageGeneratorHTML);
});
router.get("/archive", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(ArchiveHTML);
});
router.get("/storyboards", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardsHTML);
});
router.get("/storyboard", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardHTML);
});
router.get("/usage", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(UsageHTML);
});

// NEW: login page (public)
router.get("/login", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(LoginHTML);
});

export default router;
