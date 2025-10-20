// functions/services/enhance.js
// Uses Google Gemini 2.5 Flash (text) to enhance prompts.

import { DEFAULT_SYSTEM_PROMPT, ENHANCER_MODEL } from "../config.js";

/** Extract plain text from Gemini generateContent response */
function extractTextFromGemini(resp) {
  try {
    const parts =
      resp?.candidates?.[0]?.content?.parts ||
      resp?.candidates?.[0]?.content?.parts ||
      [];
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
 * Enhance a user prompt with a system instruction using Gemini text model.
 * Returns { text, modelUsed }
 */
export async function enhancePrompt({ userText, systemPrompt }) {
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!GOOGLE_KEY) throw new Error("Server missing GOOGLE_API_KEY");

  const model = ENHANCER_MODEL; // "gemini-2.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(GOOGLE_KEY)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: String(userText || "") }]
      }
    ],
    ...(systemPrompt
      ? { systemInstruction: { role: "system", parts: [{ text: systemPrompt }] } }
      : { systemInstruction: { role: "system", parts: [{ text: DEFAULT_SYSTEM_PROMPT }] } })
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Gemini text API error (${r.status})`);

  const text = extractTextFromGemini(j) || String(userText || "");
  return { text, modelUsed: `${model} (text)` };
}
