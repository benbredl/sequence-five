// functions/services/describe.js
// Multimodal (image + text) description generator using Gemini 2.5 Flash (text).
// Records billing as a "text" kind event (action: enhance_description).

import {
  recordUsage,
  costGeminiText,
  currentUnitPricesSnapshot,
  BillingConfigError
} from "./billing.js";

const MODEL = "gemini-2.5-flash";

/** Extract plain text from Gemini generateContent response */
function extractTextFromGemini(resp) {
  try {
    const parts = resp?.candidates?.[0]?.content?.parts || [];
    const chunks = [];
    for (const p of parts) {
      if (typeof p?.text === "string" && p.text.trim()) chunks.push(p.text);
    }
    return chunks.join("\n").trim();
  } catch {
    return "";
  }
}

/**
 * Call Gemini with an inline image + a JSON-formatted text prompt,
 * and an optional system instruction. Returns { text, modelUsed }.
 */
export async function describeWithImage({ systemPrompt, image, jsonTextPrompt }) {
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!GOOGLE_KEY) throw new Error("Server missing GOOGLE_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    MODEL
  )}:generateContent?key=${encodeURIComponent(GOOGLE_KEY)}`;

  // Build parts: inline image + JSON text payload
  const parts = [
    { inlineData: { mimeType: image.mimeType, data: image.base64 } },
    { text: String(jsonTextPrompt || "") }
  ];

  const body = {
    contents: [{ role: "user", parts }],
    ...(systemPrompt
      ? { systemInstruction: { role: "system", parts: [{ text: systemPrompt }] } }
      : {})
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Gemini text API error (${r.status})`);

  const text = extractTextFromGemini(j);
  const usageMeta = j?.usageMetadata || {};

  // Billing as TEXT usage (input+output tokens)
  try {
    const inputTokens = usageMeta.promptTokenCount || 0;
    const outputTokens =
      usageMeta.candidatesTokenCount || Math.max(0, (usageMeta.totalTokenCount || 0) - inputTokens);
    const cost = costGeminiText({ inputTokens, outputTokens });

    await recordUsage({
      ts: new Date(),
      service: "gemini",
      action: "enhance_description",
      kind: "text",
      model: `${MODEL} (text+image)`,
      usage: { inputTokens, outputTokens },
      unit_prices: currentUnitPricesSnapshot(),
      cost_usd: cost
    });
  } catch (e) {
    if (!(e instanceof BillingConfigError)) {
      console.error("[describeWithImage] billing write skipped:", e);
    }
  }

  return { text, modelUsed: `${MODEL} (text)` };
}
