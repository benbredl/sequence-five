// functions/routes/pages.js
import { Router } from "express";
import { HTML as ImageGeneratorHTML } from "../views/image-generator.js";
import { HTML as ArchiveHTML } from "../views/archive.js";   // <-- renamed import
import { HTML as StoryboardsHTML } from "../views/storyboards.js";
import { HTML as StoryboardHTML } from "../views/storyboard.js";
import { HTML as UsageHTML } from "../views/usage.js";

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

export default router;
