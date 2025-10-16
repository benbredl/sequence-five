import { Router } from "express";
import { HTML as Text2ImgHTML } from "../views/text2img.js";
import { HTML as GalleryHTML } from "../views/gallery.js";
import { HTML as Img2ImgHTML } from "../views/img2img.js";
import { HTML as StoryboardsHTML } from "../views/storyboards.js";
import { HTML as StoryboardHTML } from "../views/storyboard.js";

const router = Router();

router.get("/", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(Text2ImgHTML);
});
router.get("/gallery", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(GalleryHTML);
});
router.get("/img2img", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(Img2ImgHTML);
});

router.get("/storyboards", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardsHTML);
});
router.get("/storyboard", (_req, res) => {
  // expects ?id=<storyboardId>
  res.set("Content-Type", "text/html; charset=utf-8").send(StoryboardHTML);
});

export default router;
