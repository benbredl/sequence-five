// functions/routes/router.js
import { Router } from "express";
import { a } from "../utils/async.js";

import { postEnhance } from "../controllers/enhance.controller.js";
import { postGenerateImage, postDeleteImage } from "../controllers/images.controller.js";
import { getArchive, postArchiveUpload } from "../controllers/archive.controller.js"; // ← add postArchiveUpload
import { getSummary } from "../controllers/billing.controller.js";
import {
  createStoryboard,
  listStoryboards,
  getStoryboard,
  addToStoryboard,
  removeFromStoryboard,
  deleteStoryboard,
  reorderStoryboardItem,
  updateStoryboardItemDescription,
  generateStoryboardItemDescription,
} from "../controllers/storyboards.controller.js";

// NEW: Upscale controllers
import {
  postUpscaleStart,
  postUpscaleStatus,
  postEnhancorWebhook
} from "../controllers/upscale.controller.js";

const router = Router();

// --- Existing routes ---
router.post("/api/enhance", a(postEnhance));
router.post("/api/generate-image", a(postGenerateImage));
router.post("/api/image/delete", a(postDeleteImage));

router.get("/api/archive", a(getArchive));
router.get("/api/billing/summary", a(getSummary));

// Storyboards
router.post("/api/storyboards", a(createStoryboard));
router.get("/api/storyboards", a(listStoryboards));
router.get("/api/storyboard", a(getStoryboard));
router.post("/api/storyboard/add", a(addToStoryboard));
router.post("/api/storyboard/remove", a(removeFromStoryboard));
router.post("/api/storyboard/delete", a(deleteStoryboard));
router.post("/api/storyboard/update", a(updateStoryboardItemDescription));
router.post("/api/storyboard/reorder", a(reorderStoryboardItem));
router.post("/api/storyboard/generate-description", a(generateStoryboardItemDescription));

// Upscale
router.post("/api/image/upscale", a(postUpscaleStart));
router.post("/api/image/upscale-status", a(postUpscaleStatus));
router.post("/api/webhooks/enhancor", a(postEnhancorWebhook));

// --- NEW: Archive Upload ---
router.post("/api/archive/upload", a(postArchiveUpload)); // ← this fixes the 404

export default router;
