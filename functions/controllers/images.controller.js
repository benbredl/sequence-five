// functions/controllers/images.controller.js
import { enhancePrompt } from "../services/enhance.js";
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";
import { bad, err, ok } from "../utils/http.js";
import { pricingCatalog, BillingConfigError } from "../services/billing.js";

/**
 * POST /api/generate-image
 * Body:
 *  - prompt (string)
 *  - image?: { dataUrl: "data:mime;base64,..." }
 *  - systemPrompt? (string)
 *  - enhancedPrompt? (string)  // optional, if client pre-enhanced
 */
export async function postGenerateImage(req, res) {
  // Enforce ENV_FAIL: reject-requests (user-friendly error)
  try {
    pricingCatalog();
  } catch (e) {
    if (e instanceof BillingConfigError) {
      return res.status(500).json({ error: "Billing configuration missing. Please contact admin." });
    }
    return err(res, e);
  }

  try {
    const { prompt, image, systemPrompt, enhancedPrompt } = req.body || {};
    const promptStr = typeof prompt === "string" ? prompt.trim() : "";
    if (!promptStr) return bad(res, "Missing prompt");

    const hasImage =
      image && typeof image.dataUrl === "string" && /^data:/.test(image.dataUrl);

    // Image-to-Image
    if (hasImage) {
      const combined = "Show me " + promptStr;
      const m = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return bad(res, "Invalid dataUrl");
      const baseMime = m[1];
      const base64Data = m[2];

      const { mimeType, base64 } = await generateFromImage(baseMime, base64Data, combined);

      const modelUsed = "no-llm (prefix-only)";
      const { archiveUrl, id } = await saveImageAndRecord({
        mimeType,
        base64,
        prompt: combined,
        enhancedPrompt: combined,
        modelUsed,
        type: "I2I"
      });

      return ok(res, {
        enhancedPrompt: combined,
        openaiModelUsed: "none",
        mimeType,
        imageBase64: base64,
        archiveUrl,
        id
      });
    }

    // Text-to-Image
    let enhanced = enhancedPrompt;
    let modelUsed = "client-provided (pre-enhanced)";
    if (!enhanced) {
      const out = await enhancePrompt({ userText: promptStr, systemPrompt });
      enhanced = out.text;
      modelUsed = out.modelUsed;
    }
    const { mimeType, base64 } = await generateFromText(enhanced);
    const { archiveUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt: promptStr,
      enhancedPrompt: enhanced,
      modelUsed,
      type: "T2I"
    });

    return ok(res, {
      enhancedPrompt: enhanced,
      openaiModelUsed: modelUsed,
      mimeType,
      imageBase64: base64,
      archiveUrl,
      id
    });
  } catch (e) {
    // yes-fail — bubble up without fallback
    return err(res, e);
  }
}

export async function postDeleteImage(req, res) {
  try {
    const { imageId } = req.body || {};
    if (!imageId) return bad(res, "imageId required");
    const out = await deleteImageCompletely(String(imageId));
    return ok(res, out);
  } catch (e) {
    return err(res, e);
  }
}
