import { db } from "../firebase.js";
import { ok, bad, err } from "../utils/http.js";
import { enhancorQueue, enhancorStatus } from "../services/enhancor.js";
import { saveUpscaledVariantFor } from "../services/storage.js"; // keep path consistent with repo

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
        upscaledUrl: v.upscaledUrl || null
      });
    }

    const imgUrl = v.url || null;
    if (!imgUrl) return err(res, new Error("Image has no URL"), 400);

    const webhookUrl = `${req.protocol}://${req.get("host")}/api/webhooks/enhancor`;

    const { requestId } = await enhancorQueue({ imgUrl, webhookUrl });

    // Store status for polling UX
    await ref.set(
      {
        upscalerRequestId: requestId,
        upscalerStatus: "PENDING",
        updatedAt: new Date()
      },
      { merge: true }
    );

    return ok(res, { requestId, status: "PENDING" });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Poll Enhancor status and reflect it onto the image.
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
    // If already completed, surface upscaledUrl right away
    if (String(v.state || "").toLowerCase() === "upscaled") {
      return ok(res, { status: "COMPLETED", requestId: v.upscalerRequestId || null, upscaledUrl: v.upscaledUrl || null });
    }

    const reqId = v.upscalerRequestId || null;
    if (!reqId) {
      return ok(res, { status: "PENDING", requestId: null });
    }

    const st = await enhancorStatus({ requestId: reqId });

    await ref.set(
      {
        upscalerStatus: st.status,
        upscalerCost: typeof st.cost === "number" ? st.cost : undefined,
        updatedAt: new Date()
      },
      { merge: true }
    );

    return ok(res, { status: st.status, requestId: st.requestId, upscaledUrl: null });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * Enhancor webhook receiver.
 * Body: { request_id, result, status }
 * On success: downloads result, stores *_upscaled, updates doc { upscaledUrl, upscaledPath, state: "upscaled" }
 */
export async function postEnhancorWebhook(req, res) {
  try {
    const requestId = String(req.body?.request_id || req.body?.requestId || "").trim();
    const rawStatus = String(req.body?.status || "").trim();
    const status = rawStatus.toUpperCase(); // normalize
    const resultUrl = String(req.body?.result || "").trim();

    if (!requestId) return bad(res, "request_id required");

    // Find image document by requestId
    const qs = await db.collection("images").where("upscalerRequestId", "==", requestId).limit(1).get();
    if (qs.empty) return err(res, new Error("Image for request not found"), 404);

    const imageRef = qs.docs[0].ref;

    // Treat known "in-progress" statuses as non-terminal and just persist them.
    const IN_PROGRESS_STATUSES = new Set(["PENDING", "IN_QUEUE", "IN-PROGRESS", "IN_PROGRESS", "RECEIVED", "QUEUED"]);
    const FAILURE_STATUSES = new Set(["FAILED", "ERROR", "TIMEOUT", "CANCELLED", "CANCELED"]);

    if (IN_PROGRESS_STATUSES.has(status) || status === "") {
      await imageRef.set(
        { upscalerStatus: (status || "PENDING"), updatedAt: new Date() },
        { merge: true }
      );
      return ok(res, { ok: true }); // do NOT flip to failed
    }

    if (status === "SUCCESS" || status === "COMPLETED") {
      if (!resultUrl) {
        // Edge case: success without a result URL -> mark failed explicitly
        await imageRef.set(
          { upscalerStatus: "FAILED", updatedAt: new Date() },
          { merge: true }
        );
        return ok(res, { ok: true });
      }

      // Download the upscaled image
      const r = await fetch(resultUrl);
      if (!r.ok) throw new Error(`Failed to download upscaled image (${r.status})`);
      const buf = Buffer.from(await r.arrayBuffer());
      const mimeType = r.headers.get("content-type") || "image/jpeg";

      // Save variant
      const { upscaledUrl, upscaledPath } = await saveUpscaledVariantFor(qs.docs[0].id, mimeType, buf);

      // Promote state to "upscaled"
      await imageRef.set(
        {
          upscalerStatus: "COMPLETED",
          state: "upscaled",
          upscaledUrl,
          upscaledPath,
          updatedAt: new Date()
        },
        { merge: true }
      );

      return ok(res, { ok: true });
    }

    if (FAILURE_STATUSES.has(status)) {
      await imageRef.set(
        { upscalerStatus: "FAILED", updatedAt: new Date() },
        { merge: true }
      );
      return ok(res, { ok: true });
    }

    // Unknown statuses: persist as-is without failing.
    await imageRef.set(
      { upscalerStatus: status, updatedAt: new Date() },
      { merge: true }
    );
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e);
  }
}
