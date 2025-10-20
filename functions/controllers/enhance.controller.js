// functions/controllers/enhance.controller.js
import { enhancePrompt } from "../services/enhance.js";
import { bad, err, ok } from "../utils/http.js";
import { pricingCatalog, BillingConfigError } from "../services/billing.js";

export async function postEnhance(req, res) {
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
    const { prompt, systemPrompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return bad(res, "Missing prompt");
    }
    const { text: enhanced, modelUsed } = await enhancePrompt({
      userText: prompt,
      systemPrompt
    });
    return ok(res, { enhancedPrompt: enhanced, openaiModelUsed: modelUsed });
  } catch (e) {
    return err(res, e, 500, "enhance_failed");
  }
}
