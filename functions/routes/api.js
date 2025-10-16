import { Router } from "express";
import { enhancePrompt } from "../services/enhance.js";
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";

const router = Router();

/* ---------- Enhance-only: show enhanced prompt immediately ---------- */
router.post("/api/enhance", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Missing prompt" });

    const { text: enhanced, modelUsed } = await enhancePrompt({ userText: prompt, systemPrompt });
    res.json({ enhancedPrompt: enhanced, openaiModelUsed: modelUsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

/* ---------- Text → Image (accepts client-provided enhancedPrompt) ---------- */
router.post("/api/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt, enhancedPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Missing prompt" });

    let enhanced = enhancedPrompt;
    let modelUsed = "client-provided (pre-enhanced)";
    if (!enhanced) {
      const out = await enhancePrompt({ userText: prompt, systemPrompt });
      enhanced = out.text;
      modelUsed = out.modelUsed;
    }

    const { mimeType, base64 } = await generateFromText(enhanced);
    const { galleryUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt,
      enhancedPrompt: enhanced,
      modelUsed
    });

    res.json({
      enhancedPrompt: enhanced,
      openaiModelUsed: modelUsed,
      mimeType,
      imageBase64: base64,
      galleryUrl,
      id
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});
router.get("/api/generate", (_req, res) =>
  res.status(405).json({ error: "Use POST for /api/generate" })
);

/* ---------- Image → Image (NO enhancer; prefixes `Show me `) ---------- */
router.post("/api/img2img", async (req, res) => {
  try {
    const { prompt, image } = req.body || {};
    if (!image || !image.dataUrl || typeof image.dataUrl !== "string")
      return res.status(400).json({ error: "Missing base image (dataUrl)" });
    if (!prompt || typeof prompt !== "string")
      return res.status(400).json({ error: "Missing prompt" });

    const combined = "Show me " + prompt.trim();

    const m = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "Invalid dataUrl" });
    const baseMime = m[1];
    const base64Data = m[2];

    const { mimeType, base64 } = await generateFromImage(baseMime, base64Data, combined);

    const modelUsed = "no-llm (prefix-only)";
    const { galleryUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt: combined,
      enhancedPrompt: combined,
      modelUsed
    });

    res.json({
      enhancedPrompt: combined,
      openaiModelUsed: "none",
      mimeType,
      imageBase64: base64,
      galleryUrl,
      id
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

/* ---------- Gallery list ---------- */
router.get("/api/gallery", async (_req, res) => {
  try {
    const { db } = await import("../firebase.js");
    const snapRef = db.collection("images").orderBy("createdAt", "desc").limit(50);
    const snap = await snapRef.get();
    const items = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        url: v.url || null,
        thumbUrl: v.thumbUrl || null,  // preview support
        tinyUrl: v.tinyUrl || null,    // preview support
        path: v.path || null,
        prompt: v.prompt || null,
        enhancedPrompt: v.enhancedPrompt || null,
        modelUsed: v.modelUsed || null,
        mimeType: v.mimeType || null,
        createdAt: v.createdAt
          ? v.createdAt.toDate
            ? v.createdAt.toDate().toISOString()
            : v.createdAt
          : null
      };
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

/* ---------- NEW: Delete image everywhere ---------- */
router.post("/api/image/delete", async (req, res) => {
  try {
    const { imageId } = req.body || {};
    if (!imageId) return res.status(400).json({ error: "imageId required" });

    const out = await deleteImageCompletely(String(imageId));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router;
