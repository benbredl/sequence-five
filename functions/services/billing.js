// functions/services/billing.js
// Centralized pricing + usage recording for Gemini (text + image).
// Policy decided with user:
// - PRICING: env-required
// - ENV_FAIL: reject-requests (generator endpoints fail with 500 and a user-friendly message)
// - ERROR_STYLE: user (no internal details in API response)

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
 * Return the full pricing catalog (Gemini only) from required env vars.
 * Throws BillingConfigError if any are missing/invalid.
 */
export function pricingCatalog() {
  return {
    // Gemini text tokens (USD per 1M tokens)
    gemini_text_in_per_1m: readRequiredEnvNumber("PRICE_GEMINI_TEXT_INPUT_USD_PER_1M"),
    gemini_text_out_per_1m: readRequiredEnvNumber("PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M"),

    // Gemini image flat price (USD per image)
    gemini_image_per_image: readRequiredEnvNumber("PRICE_GEMINI_IMAGE_PER_IMAGE_USD"),

    // Optional note
    note: process.env.PRICE_NOTE || "",
  };
}

/** Utility: round to 6 decimals for money precision in logs (display to 2 in UI). */
export function roundMoney(n) {
  return +Number(n || 0).toFixed(6);
}

/** Compute cost for Gemini *text* usage using token counts. */
export function costGeminiText({ promptTokens = 0, outputTokens = 0 }) {
  const p = pricingCatalog(); // may throw BillingConfigError
  const inputCost = (promptTokens / 1_000_000) * p.gemini_text_in_per_1m;
  const outputCost = (outputTokens / 1_000_000) * p.gemini_text_out_per_1m;
  return roundMoney(inputCost + outputCost);
}

/**
 * Compute cost for Gemini *image* generation.
 * - Always include per-image flat price
 * - Include input token cost **only if** promptTokens provided (as per policy)
 */
export function costGeminiImage({ images = 1, promptTokens = 0 }) {
  const p = pricingCatalog(); // may throw BillingConfigError
  const perImage = images * p.gemini_image_per_image;
  const inputCost = promptTokens > 0 ? (promptTokens / 1_000_000) * p.gemini_text_in_per_1m : 0;
  return roundMoney(perImage + inputCost);
}

/**
 * Persist a single usage event in Firestore.
 * Event shape:
 * {
 *   ts: Date,
 *   service: "gemini",
 *   action: "enhance" | "t2i" | "i2i",
 *   kind: "text" | "image",   // NEW agreed field
 *   model: string,
 *   request_id?: string | null,
 *   usage?: any,              // raw usageMetadata from provider
 *   unit_prices?: object,     // optional snapshot of pricing
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
    safe.kind = a === "enhance" ? "text" : "image";
  }

  await db.collection("billing_events").add(safe);
}

/** Convenience: snapshot current unit prices (optional to store with each event). */
export function currentUnitPricesSnapshot() {
  // If pricing is misconfigured, we prefer to *not* throw here, because this is optional.
  try {
    return pricingCatalog();
  } catch {
    return null;
  }
}
