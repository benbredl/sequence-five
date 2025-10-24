import { db } from "../firebase.js";
import { ok, bad, err } from "../utils/http.js";
import { enhancorQueue, enhancorStatus } from "../services/enhancor.js";
import { saveUpscaledVariantFor } from "../services/storage.js";
import {
  recordUsage,
  currentUnitPricesSnapshot,
  costEnhancorUpscale,
} from "../services/billing.js";

/**
 * Start an upscale job for an image.
 * Body: { imageId }
 * Returns: { requestId, status }
 */
export async function postUpscaleStart(req, res) {
  try {
    const imageId = String(req.body?.imageId || "").trim();
    if (!imageId) return bad(res, "imageId required");

    const ref = db.collection("images").doc(imageId);
    const doc = await ref.get();
    if (!doc.exists) return err(res, new Error("Image not found"), 404);

    const v = doc.data() || {};
    if (String(v.state || "").toLowerCase() === "upscaled") {
      return ok(res, {
        requestId: v.upscalerRequestId || null,
        status: "COMPLETED",
        upscaledUrl: v.upscaledUrl || null,
      });
    }

    const imgUrl = v.url || null;
    if (!imgUrl) return err(res, new Error("Image has no URL"), 400);

    const webhookUrl = `${req.protocol}://${req.get("host")}/api/webhooks/enhancor`;
    const { requestId } = await enhancorQueue({ imgUrl, webhookUrl });

    await ref.set(
      {
        upscalerRequestId: requestId,
        upscalerStatus: "PENDING",
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return ok(res, { requestId, status: "PENDING" });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Poll Enhancor status.
 * Body: { imageId }
 * Returns: { status, requestId, upscaledUrl? }
 */
export async function postUpscaleStatus(req, res) {
  try {
    const imageId = String(req.body?.imageId || "").trim();
    if (!imageId) return bad(res, "imageId required");

    const ref = db.collection("images").doc(imageId);
    const doc = await ref.get();
    if (!doc.exists) return err(res, new Error("Image not found"), 404);

    const v = doc.data() || {};
    if (String(v.state || "").toLowerCase() === "upscaled") {
      return ok(res, {
        status: "COMPLETED",
        requestId: v.upscalerRequestId || null,
        upscaledUrl: v.upscaledUrl || null,
      });
    }

    const reqId = v.upscalerRequestId || null;
    if (!reqId) return ok(res, { status: "PENDING", requestId: null });

    const st = await enhancorStatus({ requestId: reqId });

    await ref.set(
      {
        upscalerStatus: st.status,
        // st.cost is credits (if provided by Enhancor)
        upscalerCost: typeof st.cost === "number" ? st.cost : undefined,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return ok(res, { status: st.status, requestId: st.requestId, upscaledUrl: null });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Enhancor webhook receiver (COMPLETED/FAILED).
 * Body (per docs): { request_id, result, status: "success" | "failed" }
 * On success:
 *   - Downloads result, saves *_upscaled
 *   - Marks image { state:"upscaled", upscaledUrl, ... }
 *   - Records billing event for Enhancor (credits → USD). If webhook lacks credits, fetch via /status.
 *
 * All billing is NON-BLOCKING and will never fail the webhook.
 */
export async function postEnhancorWebhook(req, res) {
  try {
    const requestId = String(req.body?.request_id || req.body?.requestId || "").trim();
    const rawStatus = String(req.body?.status || "").trim();
    const statusUpper = rawStatus.toUpperCase(); // normalize
    // Accept multiple possible payload keys for the result URL
    const resultUrl = String(req.body?.result || "").trim();

    if (!requestId) return bad(res, "request_id required");

    // Find the image document for this request
    const qs = await db
      .collection("images")
      .where("upscalerRequestId", "==", requestId)
      .limit(1)
      .get();
    if (qs.empty) return err(res, new Error("Image for request not found"), 404);

    const imageRef = qs.docs[0].ref;
    const imageId = qs.docs[0].id;

    // Map webhook statuses to a small set
    const isSuccess = statusUpper === "SUCCESS" || statusUpper === "COMPLETED";
    const isFailure = statusUpper === "FAILED" || statusUpper === "ERROR";

    if (!isSuccess && !isFailure) {
      // Persist intermediate/unknown statuses without breaking
      await imageRef.set(
        { upscalerStatus: statusUpper || "PENDING", updatedAt: new Date() },
        { merge: true }
      );
      return ok(res, { ok: true });
    }

    if (isFailure) {
      await imageRef.set(
        { upscalerStatus: "FAILED", updatedAt: new Date() },
        { merge: true }
      );
      return ok(res, { ok: true });
    }

    // SUCCESS path
    if (!resultUrl) {
      await imageRef.set(
        { upscalerStatus: "FAILED", updatedAt: new Date() },
        { merge: true }
      );
      return ok(res, { ok: true });
    }

    // Download upscaled image
    let buf = null;
    let mimeType = "image/jpeg";
    try {
      const r = await fetch(resultUrl);
      if (!r.ok) throw new Error(`Failed to download upscaled image (${r.status})`);
      buf = Buffer.from(await r.arrayBuffer());
      mimeType = r.headers.get("content-type") || "image/jpeg";
    } catch (downloadErr) {
      console.error("[upscale webhook] download error:", downloadErr);
      await imageRef.set({ upscalerStatus: "FAILED", updatedAt: new Date() }, { merge: true });
      return ok(res, { ok: true });
    }

    // Save variant & update state
    try {
      const { upscaledUrl, upscaledPath } = await saveUpscaledVariantFor(imageId, mimeType, buf);
      await imageRef.set(
        {
          upscalerStatus: "COMPLETED",
          state: "upscaled",
          upscaledUrl,
          upscaledPath,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (persistErr) {
      console.error("[upscale webhook] persist error:", persistErr);
      await imageRef.set({ upscalerStatus: "FAILED", updatedAt: new Date() }, { merge: true });
      return ok(res, { ok: true });
    }

    // ---- Non-blocking billing event for Enhancor ----
    try {
      // Prefer credits from webhook if ever provided; otherwise fetch via /status
      let credits = Number(req.body?.credits ?? req.body?.cost) || 0;
      if (!credits) {
        try {
          const st = await enhancorStatus({ requestId });
          if (typeof st.cost === "number") credits = st.cost;
        } catch (sErr) {
          // If /status fails, we still do not want to break webhook; just skip billing.
          console.warn("[enhancor billing] status fetch failed:", sErr?.message || sErr);
        }
      }

      if (credits > 0) {
        const unit_prices = currentUnitPricesSnapshot(); // may be null if not configured
        let cost_usd = 0;
        try {
          cost_usd = costEnhancorUpscale({ credits });
        } catch (pricingErr) {
          // Pricing misconfig must not break webhook; skip billing write.
          console.warn("[enhancor billing] pricing unavailable:", pricingErr?.message || pricingErr);
        }

        if (cost_usd > 0) {
          await recordUsage({
            ts: new Date(),
            service: "enhancor",
            action: "upscale",
            kind: "upscale",
            model: "enhancor",
            imageId,
            usage: { credits },
            unit_prices,
            cost_usd,
          });
        }
      }
    } catch (billingWriteErr) {
      // Absolutely non-blocking: never fail the webhook for billing
      console.error("[enhancor billing] write skipped:", billingWriteErr);
    }

    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e);
  }
}
