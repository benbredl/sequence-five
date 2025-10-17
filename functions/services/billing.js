// functions/services/billing.js
import { db } from "../firebase.js";

/** Read unit prices from env (USD). We store per 1M tokens to match docs. */
function envNum(name, fallback) {
  const v = process.env[name];
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function unitPrices() {
  return {
    openai_gpt5mini_in_per_1m: envNum("PRICE_OPENAI_GPT5_MINI_INPUT_USD_PER_1M", 0.25),
    openai_gpt5mini_out_per_1m: envNum("PRICE_OPENAI_GPT5_MINI_OUTPUT_USD_PER_1M", 2.00),
    gemini_image_per_image: envNum("PRICE_GEMINI_IMAGE_PER_IMAGE_USD", 0.039),
    note: process.env.PRICE_NOTE || ""
  };
}

/** Compute OpenAI enhancer cost from token usage. */
export function costOpenAI_GPT5Mini({ promptTokens = 0, completionTokens = 0 }) {
  const p = unitPrices();
  const inCost = (promptTokens / 1_000_000) * p.openai_gpt5mini_in_per_1m;
  const outCost = (completionTokens / 1_000_000) * p.openai_gpt5mini_out_per_1m;
  return +(inCost + outCost).toFixed(6);
}

/** Compute Gemini per-image cost. */
export function costGeminiPerImage({ images = 1 }) {
  const p = unitPrices();
  return +(images * p.gemini_image_per_image).toFixed(6);
}

/** Persist a single usage event. */
export async function recordUsage(event) {
  // event example:
  // { ts: new Date(), service:'openai'|'gemini', action:'enhance'|'t2i'|'i2i',
  //   model, request_id, usage: {...}, cost_usd, imageId?, meta? }
  const safe = { ...event };
  if (!(safe.ts instanceof Date)) safe.ts = new Date();
  await db.collection("billing_events").add(safe);
}

/** Utility: round to 6 decimals for money precision in logs (display to 2 in UI). */
export function roundMoney(n) { return +Number(n || 0).toFixed(6); }
