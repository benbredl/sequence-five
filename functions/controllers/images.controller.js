// functions/controllers/images.controller.js
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";
import { bad, err, ok } from "../utils/http.js";
import { pricingCatalog, BillingConfigError } from "../services/billing.js";

/**
 * POST /api/generate-image
 * Body:
 *  - prompt (string)            // this is the FINAL prompt the model will see
 *  - image?: { dataUrl: "data:mime;base64,..." }  // optional I2I
 *  - systemPrompt? (string)     // ignored here (no auto-enhance server-side)
 *
 * IMPORTANT:
 * - We DO NOT enhance on the server anymore.
 * - We DO NOT store enhancedPrompt.
 * - We DO NOT store width/height.
 * - We DO store: state: "base-image" and model: "gemini-2.5-flash-image".
 */
export async function postGenerateImage(req, res) {
  // Enforce ENV_FAIL: reject-requests (user-friendly error)
  try {
    pricingCatalog();
  } catch (e) {
    if (e instanceof BillingConfigError) {
      return res
        .status(500)
        .json({ error: "Billing configuration missing. Please contact admin." });
    }
    return err(res, e);
  }

  try {
    const { prompt, image } = req.body || {};
    const promptStr = typeof prompt === "string" ? prompt.trim() : "";
    if (!promptStr) return bad(res, "Missing prompt");

    const hasImage =
      image && typeof image.dataUrl === "string" && /^data:/.test(image.dataUrl);

    // Common metadata for DB rows
    const model = "gemini-2.5-flash-image";
    const state = "base-image";

    // Image-to-Image
    if (hasImage) {
      const m = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return bad(res, "Invalid dataUrl");
      const baseMime = m[1];
      const base64Data = m[2];

      // Final prompt is exactly what we send — no server-side enhancement.
      const finalPrompt = promptStr;

      const { mimeType, base64 } = await generateFromImage(baseMime, base64Data, finalPrompt);

      const { archiveUrl, id } = await saveImageAndRecord({
        mimeType,
        base64,
        prompt: finalPrompt,
        model,
        state
      });

      return ok(res, {
        mimeType,
        imageBase64: base64,
        archiveUrl,
        id
      });
    }

    // Text-to-Image
    // Final prompt is exactly what the user provided.
    const finalPrompt = promptStr;

    const { mimeType, base64 } = await generateFromText(finalPrompt);
    const { archiveUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt: finalPrompt,
      model,
      state
    });

    return ok(res, {
      mimeType,
      imageBase64: base64,
      archiveUrl,
      id
    });
  } catch (e) {
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
