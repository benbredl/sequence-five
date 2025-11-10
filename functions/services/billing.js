// Centralized pricing + usage recording for Gemini (text + image) and Enhancor (upscale).
// Now also supports Midjourney per-job pricing (4-pack).

import { db } from "../firebase.js";

/** User-facing error when pricing env vars are missing. */
export class BillingConfigError extends Error {
  constructor() {
    super("Billing configuration missing. Please contact admin.");
    this.name = "BillingConfigError";
    this.code = "BILLING_CONFIG_MISSING";
  }
}

/** Read/validate required env pricing. Throw if anything is missing. */
function readRequiredEnvNumber(name) {
  const raw = process.env[name];
  if (raw == null || raw === "") throw new BillingConfigError();
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) throw new BillingConfigError();
  return num;
}

/**
 * Return the full pricing catalog from env vars.
 * Throws BillingConfigError if any required value is missing/invalid.
 *
 * Env keys expected:
 *  - PRICE_GEMINI_TEXT_INPUT_USD_PER_1M
 *  - PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M
 *  - PRICE_GEMINI_IMAGE_USD_PER_IMAGE
 *  - PRICE_ENHANCOR_USD_PER_1K
 *  - PRICE_MIDJOURNEY_IMAGE_USD_PER_JOB        <-- NEW
 */
export function pricingCatalog() {
  return {
    // Gemini (USD)
    gemini_text_in_per_1m: readRequiredEnvNumber("PRICE_GEMINI_TEXT_INPUT_USD_PER_1M"),
    gemini_text_out_per_1m: readRequiredEnvNumber("PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M"),
    gemini_image_per_image: readRequiredEnvNumber("PRICE_GEMINI_IMAGE_USD_PER_IMAGE"),

    // Enhancor (USD)
    enhancor_per_1k: readRequiredEnvNumber("PRICE_ENHANCOR_USD_PER_1K"),

    // Midjourney (USD) — per job (4-pack)
    midjourney_per_job: readRequiredEnvNumber("PRICE_MIDJOURNEY_IMAGE_USD_PER_JOB"),

    note: process.env.PRICE_NOTE || "",
    effective_at: new Date().toISOString(),
  };
}

/** Utility: round to 6 decimals for money precision in logs (display to 2 in UI). */
export function roundMoney(n) {
  return +Number(n || 0).toFixed(6);
}

/** Gemini text pricing by tokens. */
export function costGeminiText({ promptTokens = 0, outputTokens = 0 }) {
  const p = pricingCatalog();
  const inputCost = (promptTokens / 1_000_000) * p.gemini_text_in_per_1m;
  const outputCost = (outputTokens / 1_000_000) * p.gemini_text_out_per_1m;
  return roundMoney(inputCost + outputCost);
}

/** Gemini image generation pricing by image + (optional) prompt tokens. */
export function costGeminiImage({ images = 1, promptTokens = 0 }) {
  const p = pricingCatalog();
  const perImage = images * p.gemini_image_per_image;
  const inputCost = promptTokens > 0 ? (promptTokens / 1_000_000) * p.gemini_text_in_per_1m : 0;
  return roundMoney(perImage + inputCost);
}

/** Enhancor upscale pricing by credits. */
export function costEnhancorUpscale({ credits = 0 }) {
  const p = pricingCatalog();
  const usd = (Number(credits || 0) / 1000) * p.enhancor_per_1k;
  return roundMoney(usd);
}

/** Midjourney (per job / 4-pack). */
export function costMidjourneyJob({ jobs = 1 }) {
  const p = pricingCatalog();
  return roundMoney(Number(jobs || 1) * p.midjourney_per_job);
}

/**
 * Persist a single usage event in Firestore.
 * Shape:
 * {
 *   ts: Date,
 *   service: "gemini" | "enhancor" | "midjourney",
 *   action: "t2i" | "i2i" | "enhance" | "upscale" | ...,
 *   kind: "image" | "text" | "upscale",
 *   model: string,
 *   request_id?: string | null,
 *   usage?: any,
 *   unit_prices?: object,
 *   cost_usd: number,
 *   imageId?: string,
 *   meta?: any
 * }
 */
export async function recordUsage(event) {
  const safe = { ...event };
  if (!(safe.ts instanceof Date)) safe.ts = new Date();

  // Normalize kind from action if not supplied
  if (!safe.kind) {
    const a = String(safe.action || "").toLowerCase();
    if (a === "enhance" || a === "enhance_prompt" || a === "enhance_description") {
      safe.kind = "text";
    } else if (a === "upscale") {
      safe.kind = "upscale";
    } else {
      safe.kind = "image";
    }
  }

  await db.collection("billing_events").add(safe);
}

/** Snapshot unit prices (do NOT throw — returning null is fine). */
export function currentUnitPricesSnapshot() {
  try {
    return pricingCatalog();
  } catch {
    return null;
  }
}
