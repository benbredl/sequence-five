const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_ID = "gemini-2.5-flash-image";

import { recordUsage, costGeminiPerImage } from "./billing.js";

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
      imageConfig: { aspectRatio: "16:9" } // ✅ always 16:9
    }
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `Gemini API error (${r.status})`);

  // Extract image
  const partsOut = j?.candidates?.[0]?.content?.parts || [];
  const img = partsOut.find(p => p.inlineData || p.inline_data);
  const mimeType = img?.inlineData?.mimeType || img?.inline_data?.mimeType || "image/png";
  const data = (img?.inlineData?.data || img?.inline_data?.data || "").trim();

  // Usage (telemetry; billing is per image, $/image)
  const usage = j?.usageMetadata || null;

  // Record billing event
  const cost_usd = costGeminiPerImage({ images: 1 });
  await recordUsage({
    ts: new Date(),
    service: "gemini",
    action, // "t2i" | "i2i"
    model: MODEL_ID,
    request_id: j?.candidates?.[0]?.safetyRatings ? null : null, // no stable request-id surfaced
    usage,
    unit_prices: {
      gemini_image_per_image: Number(process.env.PRICE_GEMINI_IMAGE_PER_IMAGE_USD || 0.039)
    },
    cost_usd
  });

  return { mimeType, base64: data };
}

export async function generateFromText(enhancedText) {
  return callGemini(partsFromT2I(enhancedText), { action: "t2i" });
}

export async function generateFromImage(mimeType, base64Data, enhancedText) {
  return callGemini(partsFromI2I(mimeType, base64Data, enhancedText), { action: "i2i" });
}
