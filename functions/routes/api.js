// functions/routes/api.js
import { Router } from "express";
import { a } from "../utils/async.js";

import { postEnhance } from "../controllers/enhance.controller.js";
import { postGenerateImage, postDeleteImage } from "../controllers/images.controller.js";
import { getGallery } from "../controllers/gallery.controller.js";
import { getSummary } from "../controllers/billing.controller.js";
import {
  createStoryboard,
  listStoryboards,
  getStoryboard,
  addToStoryboard,
  removeFromStoryboard,
  deleteStoryboard
} from "../controllers/storyboards.controller.js";

const router = Router();

// Enhance
router.post("/api/enhance", a(postEnhance));

// Generate/Images
router.post("/api/generate-image", a(postGenerateImage));
router.post("/api/image/delete", a(postDeleteImage));

// Gallery
router.get("/api/gallery", a(getGallery));

// Storyboards
router.post("/api/storyboards", a(createStoryboard));
router.get("/api/storyboards", a(listStoryboards));
router.get("/api/storyboard", a(getStoryboard));
router.post("/api/storyboard/add", a(addToStoryboard));
router.post("/api/storyboard/remove", a(removeFromStoryboard));
router.post("/api/storyboard/delete", a(deleteStoryboard));

// Billing
router.get("/api/billing/summary", a(getSummary));

export default router;
