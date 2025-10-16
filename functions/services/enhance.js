import { OPENAI_MODEL, DEFAULT_SYSTEM_PROMPT } from "../config.js";

function extractTextFromResponses(resp) {
  if (resp && typeof resp.output_text === "string" && resp.output_text.trim()) {
    return resp.output_text.trim();
  }
  if (resp && Array.isArray(resp.output)) {
    const parts = [];
    for (const item of resp.output) {
      const content = item && item.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (c && typeof c.text === "string") parts.push(c.text);
          else if (typeof c === "string") parts.push(c);
        }
      }
    }
    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }
  return "";
}

export async function enhancePrompt({ userText, systemPrompt }) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) throw new Error("Server missing OPENAI_API_KEY");

  const model = OPENAI_MODEL;
  const system = (systemPrompt && systemPrompt.trim()) || DEFAULT_SYSTEM_PROMPT;

  // Try Responses API (latest docs)
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + OPENAI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions: system, input: userText })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || `OpenAI Responses error (${r.status})`);
    const text = extractTextFromResponses(j);
    return { text: text || userText, modelUsed: `${model} via responses` };
  } catch {
    // Fallback: Chat Completions
    const r2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + OPENAI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userText }
        ],
        temperature: 0.8
      })
    });
    const j2 = await r2.json();
    if (!r2.ok) throw new Error(j2.error?.message || `OpenAI Chat error (${r2.status})`);
    const text = (j2.choices?.[0]?.message?.content || "").trim();
    return { text: text || userText, modelUsed: `${model} via chat.completions` };
  }
}
