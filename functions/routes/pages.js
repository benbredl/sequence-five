import { Router } from "express";
import { HTML as ImageGeneratorHTML } from "../views/image-generator.js";
import { HTML as GalleryHTML } from "../views/gallery.js";
import { HTML as StoryboardsHTML } from "../views/storyboards.js";
import { HTML as StoryboardHTML } from "../views/storyboard.js";
import { HTML as DashboardHTML } from "../views/dashboard.js";

const router = Router();

/* Home = unified Image Generator */
router.get("/", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(ImageGeneratorHTML);
});

/* Explicit route if you want /image-generator as well */
router.get("/image-generator", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(ImageGeneratorHTML);
});

router.get("/gallery", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(GalleryHTML);
});

router.get("/storyboards", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardsHTML);
});

router.get("/storyboard", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardHTML);
});

router.get("/dashboard", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(DashboardHTML);
});

export default router;
