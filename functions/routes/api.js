// functions/routes/api.js
import { Router } from "express";
import { a } from "../utils/async.js";

import { postEnhance } from "../controllers/enhance.controller.js";
import { postGenerateImage, postDeleteImage } from "../controllers/images.controller.js";
import { getArchive } from "../controllers/archive.controller.js";
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
  generateStoryboardItemDescription, // NEW
} from "../controllers/storyboards.controller.js";

const router = Router();

// Enhance
router.post("/api/enhance", a(postEnhance));

// Generate/Images
router.post("/api/generate-image", a(postGenerateImage));
router.post("/api/image/delete", a(postDeleteImage));

// Archive
router.get("/api/archive", a(getArchive));

// Storyboards
router.post("/api/storyboards", a(createStoryboard));
router.get("/api/storyboards", a(listStoryboards));
router.get("/api/storyboard", a(getStoryboard));
router.post("/api/storyboard/add", a(addToStoryboard));
router.post("/api/storyboard/remove", a(removeFromStoryboard));
router.post("/api/storyboard/delete", a(deleteStoryboard));

// Save description (existing)
router.post("/api/storyboard/update", a(updateStoryboardItemDescription));

// NEW: reorder item (save on drop)
router.post("/api/storyboard/reorder", a(reorderStoryboardItem));

// NEW: generate description (text+image to Gemini)
router.post("/api/storyboard/generate-description", a(generateStoryboardItemDescription));

// Billing
router.get("/api/billing/summary", a(getSummary));

export default router;
