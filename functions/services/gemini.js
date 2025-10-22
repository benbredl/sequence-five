// functions/services/gemini.js
// Gemini image generation (T2I/I2I) + billing integration (kind: "image")

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
export const MODEL_ID = "gemini-2.5-flash-image";

import { recordUsage, costGeminiImage, currentUnitPricesSnapshot, BillingConfigError } from "./billing.js";

function partsFromT2I(text) {
  return [{ text }];
}
function partsFromI2I(mimeType, base64Data, text) {
  return [{ inlineData: { mimeType, data: base64Data } }, { text }];
}

async function callGemini(parts, { action }) {
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!GOOGLE_KEY) throw new Error("Server missing GOOGLE_API_KEY");

  const url = `${BASE_URL}/${MODEL_ID}:generateContent?key=${encodeURIComponent(GOOGLE_KEY)}`;
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["Image"],
      imageConfig: { aspectRatio: "16:9" }
    }
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Gemini API error (${r.status})`);

  const partsOut = j?.candidates?.[0]?.content?.parts || [];
  const img = partsOut.find((p) => p.inlineData || p.inline_data);
  const mimeType = img?.inlineData?.mimeType || img?.inline_data?.mimeType || "image/png";
  const data = (img?.inlineData?.data || img?.inline_data?.data || "").trim();

  const usage = j?.usageMetadata || null;
  const promptTokens = usage?.promptTokenCount || 0;

  // Billing: compute cost
  try {
    const cost_usd = costGeminiImage({
      images: 1,
      promptTokens
    });
    await recordUsage({
      ts: new Date(),
      service: "gemini",
      action, // "t2i" | "i2i"
      kind: "image",
      model: MODEL_ID,
      request_id: null,
      usage,
      unit_prices: currentUnitPricesSnapshot(),
      cost_usd
    });
  } catch (e) {
    if (!(e instanceof BillingConfigError)) throw e;
  }

  return { mimeType, base64: data };
}

export async function generateFromText(enhancedText) {
  return callGemini(partsFromT2I(enhancedText), { action: "t2i" });
}

export async function generateFromImage(mimeType, base64Data, enhancedText) {
  return callGemini(partsFromI2I(mimeType, base64Data, enhancedText), { action: "i2i" });
}
