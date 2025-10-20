// functions/routes/api.js
import { Router } from "express";
import { enhancePrompt } from "../services/enhance.js";
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";

const router = Router();

/* ---------- Prompt Enhancer ---------- */
router.post("/api/enhance", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt", code: "bad_request" });
    }
    const { text: enhanced, modelUsed } = await enhancePrompt({ userText: prompt, systemPrompt });
    res.json({ enhancedPrompt: enhanced, openaiModelUsed: modelUsed });
  } catch (e) {
    const msg = e?.message || String(e);
    console.error("enhance error:", msg);
    res.status(500).json({ error: msg, code: "enhance_failed" });
  }
});

/* ---------- Unified generate-image ---------- */
router.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, image, systemPrompt, enhancedPrompt } = req.body || {};
    const promptStr = typeof prompt === "string" ? prompt.trim() : "";
    if (!promptStr) return res.status(400).json({ error: "Missing prompt" });

    const hasImage = image && typeof image.dataUrl === "string" && /^data:/.test(image.dataUrl);

    if (hasImage) {
      const combined = "Show me " + promptStr;
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
        modelUsed,
        type: "I2I"
      });

      return res.json({
        enhancedPrompt: combined,
        openaiModelUsed: "none",
        mimeType,
        imageBase64: base64,
        galleryUrl,
        id
      });
    } else {
      let enhanced = enhancedPrompt;
      let modelUsed = "client-provided (pre-enhanced)";
      if (!enhanced) {
        const out = await enhancePrompt({ userText: promptStr, systemPrompt });
        enhanced = out.text;
        modelUsed = out.modelUsed;
      }
      const { mimeType, base64 } = await generateFromText(enhanced);
      const { galleryUrl, id } = await saveImageAndRecord({
        mimeType,
        base64,
        prompt: promptStr,
        enhancedPrompt: enhanced,
        modelUsed,
        type: "T2I"
      });

      return res.json({
        enhancedPrompt: enhanced,
        openaiModelUsed: modelUsed,
        mimeType,
        imageBase64: base64,
        galleryUrl,
        id
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

/* ---------- Gallery + Delete ---------- */
router.get("/api/gallery", async (req, res) => {
  try {
    const { db } = await import("../firebase.js");
    const limit = Math.min(parseInt(req.query.limit || "24", 10) || 24, 60);
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    let ref = db.collection("images").orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
      const curDoc = await db.collection("images").doc(cursor).get();
      if (curDoc.exists) ref = ref.startAfter(curDoc);
    }

    const snap = await ref.get();
    const items = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        url: v.url || null,
        thumbUrl: v.thumbUrl || null,
        tinyUrl: v.tinyUrl || null,
        path: v.path || null,
        prompt: v.prompt || null,
        enhancedPrompt: v.enhancedPrompt || null,
        modelUsed: v.modelUsed || null,
        type: v.type || null,
        mimeType: v.mimeType || null,
        createdAt: v.createdAt
          ? v.createdAt.toDate
            ? v.createdAt.toDate().toISOString()
            : v.createdAt
          : null
      };
    });

    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
    res.json({ items, nextCursor });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

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
