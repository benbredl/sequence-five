// functions/controllers/images.controller.js
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";
import { bad, err, ok } from "../utils/http.js";
import { pricingCatalog, BillingConfigError } from "../services/billing.js";
import { db, FieldValueServer } from "../firebase.js";

/** Robust base64url-safe JWT payload decode (no signature verify). */
function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Try to get a UID: req.user.uid -> custom headers -> bearer payload -> body (uid/userId)
function getUidFromRequest(req) {
  if (req?.user?.uid && String(req.user.uid).trim()) return String(req.user.uid).trim();

  const headerKeys = [
    "x-user-uid",
    "x-user-id",
    "x-firebase-uid",
    "x-uid",
    "x-user",
    "x-client-uid"
  ];
  for (const k of headerKeys) {
    const v = req.headers?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  const auth = req.headers?.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme === "Bearer" && token) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      const uid = (payload.user_id || payload.sub || payload.uid || "").toString().trim();
      if (uid) return uid;
    }
  }

  const bodyAliases = ["uid", "userId", "firebaseUid"];
  for (const key of bodyAliases) {
    const v = req.body?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  return null;
}

/* -------------------------- Midjourney helpers -------------------------- */

const APIFRAME_URL = "https://api.apiframe.pro";

function getApiFrameKey() {
  const key = process.env.APIFRAME_API_KEY || process.env.APIFRAME_KEY || "";
  if (!key) throw new Error("Server missing APIFRAME_API_KEY");
  return key;
}

function getWebhookSecret() {
  return process.env.APIFRAME_WEBHOOK_SECRET || process.env.MIDJOURNEY_WEBHOOK_SECRET || "";
}

/** Upsert a task row so we can link the webhook back to a user. */
async function upsertMjTask(taskId, data) {
  const ref = db.collection("mj_tasks").doc(String(taskId));
  await ref.set(
    { ...data, updatedAt: new Date(), createdAt: data.createdAt || new Date() },
    { merge: true }
  );
  return ref;
}

/**
 * Idempotent persist of one Midjourney image:
 * - Check if an image for (taskId, originalUrl) already exists → reuse
 * - Otherwise download & save, tagging uid + taskId + originalUrl
 *
 * NOTE: Per request, we DO NOT store any `originalUrlNorm` or `sha256`.
 */
async function persistMjImage({ url, prompt, uid, taskId }) {
  // 1) Guard against duplicates (by exact original URL only)
  const existing = await db.collection("images")
    .where("mjTaskId", "==", String(taskId))
    .where("originalUrl", "==", String(url))
    .limit(1)
    .get();

  if (!existing.empty) {
    const d = existing.docs[0];
    const v = d.data() || {};
    return { id: d.id, archiveUrl: v.url || null };
  }

  // 2) Download + save
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Midjourney image download failed (${r.status})`);
  const mime = r.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await r.arrayBuffer());
  const base64 = buf.toString("base64");

  const { archiveUrl, id } = await saveImageAndRecord({
    mimeType: mime,
    base64,
    prompt: prompt || "",
    model: "midjourney",
    state: "base-image",
    userId: uid || null
  });

  if (id) {
    // Minimal meta only: NO originalUrlNorm, NO sha256
    await db.collection("images").doc(id).set(
      {
        uid: uid || null,
        userId: FieldValueServer.delete(),
        mjTaskId: String(taskId),
        originalUrl: String(url)
      },
      { merge: true }
    );
  }
  return { id, archiveUrl };
}

/* ---------------------------- Controllers ---------------------------- */

export async function postGenerateImage(req, res) {
  try {
    pricingCatalog();
  } catch (e) {
    if (e instanceof BillingConfigError) {
      return res.status(500).json({ error: "Billing configuration missing. Please contact admin." });
    }
    return err(res, e);
  }

  try {
    const { prompt, image, provider } = req.body || {};
    const promptStr = typeof prompt === "string" ? prompt.trim() : "";
    if (!promptStr) return bad(res, "Missing prompt");

    const uid = getUidFromRequest(req);
    if (!uid) {
      return bad(
        res,
        "Missing user identity. Send a UID via header x-user-uid / x-firebase-uid, a Bearer Firebase ID token, or body.uid."
      );
    }

    const requestedProvider = String(provider || "gemini").toLowerCase();
    const hasImage = image && typeof image.dataUrl === "string" && /^data:/.test(image.dataUrl);

    // ------------------- Midjourney path (queue) -------------------
    if (requestedProvider === "midjourney") {
      if (hasImage) {
        return bad(res, "Midjourney does not support an input image. Remove the upload to use Midjourney.");
      }
      const key = getApiFrameKey();
      const webhookSecret = getWebhookSecret();
      const webhookUrl = `${req.protocol}://${req.get("host")}/api/webhooks/midjourney`;

      const payload = {
        prompt: promptStr,
        aspect_ratio: "16:9",
        webhook_url: webhookUrl
      };
      if (webhookSecret) payload.webhook_secret = webhookSecret;

      const r = await fetch(`${APIFRAME_URL}/imagine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": key
        },
        body: JSON.stringify(payload)
      });

      let j = {};
      try { j = await r.json(); } catch { j = {}; }
      if (!r.ok) {
        const msg = j?.errors?.[0]?.msg || "Failed to queue Midjourney task";
        return err(res, new Error(msg), r.status || 500);
      }
      const taskId = String(j.task_id || "").trim();
      if (!taskId) return err(res, new Error("Midjourney task id missing"));

      await upsertMjTask(taskId, {
        uid, prompt: promptStr, status: "QUEUED", provider: "midjourney"
      });

      return ok(res, { queued: true, provider: "midjourney", taskId });
    }

    // ------------------- Gemini path (sync like before) -------------------
    const model = "gemini-2.5-flash-image";
    const state = "base-image";

    if (hasImage) {
      const m = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return bad(res, "Invalid dataUrl");
      const baseMime = m[1];
      const base64Data = m[2];

      const finalPrompt = promptStr;
      const { mimeType, base64 } = await generateFromImage(baseMime, base64Data, finalPrompt);

      const { archiveUrl, id } = await saveImageAndRecord({
        mimeType,
        base64,
        prompt: finalPrompt,
        model,
        state
      });

      if (id) {
        await db.collection("images").doc(id).set(
          { uid, userId: FieldValueServer.delete() },
          { merge: true }
        );
      }

      return ok(res, { mimeType, imageBase64: base64, archiveUrl, id });
    }

    // Text-to-Image
    const finalPrompt = promptStr;
    const { mimeType, base64 } = await generateFromText(finalPrompt);
    const { archiveUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt: finalPrompt,
      model,
      state
    });

    if (id) {
      await db.collection("images").doc(id).set(
        { uid, userId: FieldValueServer.delete() },
        { merge: true }
      );
    }

    return ok(res, { mimeType, imageBase64: base64, archiveUrl, id });
  } catch (e) {
    return err(res, e);
  }
}

export async function postDeleteImage(req, res) {
  try {
    const { imageId } = req.body || {};
    if (!imageId) return bad(res, "imageId required");
    const out = await deleteImageCompletely(String(imageId));
    return ok(res, out);
  } catch (e) {
    return err(res, e);
  }
}

/* ------------------- Midjourney webhook + result fetch ------------------- */

export async function postMidjourneyWebhook(req, res) {
  try {
    const headerSecret = String(req.headers["x-webhook-secret"] || "").trim();
    const expectSecret = getWebhookSecret();
    if (expectSecret && headerSecret !== expectSecret) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const body = req.body || {};
    const taskId = String(body.task_id || "").trim();
    if (!taskId) return bad(res, "task_id required");
    const status = String(body.status || "").toLowerCase();

    const taskRef = db.collection("mj_tasks").doc(taskId);
    const taskDoc = await taskRef.get();
    const task = taskDoc.exists ? (taskDoc.data() || {}) : {};

    if (!taskDoc.exists) {
      await upsertMjTask(taskId, { status: status || "PROCESSING" });
    }

    // Progress-only updates
    if (!Array.isArray(body.image_urls) || body.image_urls.length === 0) {
      await upsertMjTask(taskId, {
        status: (status || "PROCESSING").toUpperCase(),
        percentage: body.percentage || null
      });
      return ok(res, { ok: true });
    }

    // Completed: persist up to 4 images (idempotent; no url normalization or hashing)
    const imageUrls = body.image_urls.slice(0, 4);
    const prompt = task?.prompt || "";
    const uid = task?.uid || null;

    const results = [];
    for (const u of imageUrls) {
      try {
        const saved = await persistMjImage({ url: u, prompt, uid, taskId });
        results.push(saved);
      } catch (e) {
        console.error("[midjourney webhook] persist error:", e?.message || e);
      }
    }

    await upsertMjTask(taskId, {
      status: "COMPLETED",
      original_image_url: body.original_image_url || null,
      result_count: results.length
    });

    return ok(res, { ok: true, saved: results.length });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * GET /api/mj-result?taskId=...
 * Returns any images saved for this Midjourney task (max 4) for the current user.
 */
export async function getMidjourneyResult(req, res) {
  try {
    const taskId = String(req.query.taskId || "").trim();
    if (!taskId) return bad(res, "taskId required");

    const uid = getUidFromRequest(req);
    if (!uid) return bad(res, "Missing user identity.");

    const taskDoc = await db.collection("mj_tasks").doc(taskId).get();
    if (!taskDoc.exists) return ok(res, { items: [], status: "UNKNOWN" });

    const task = taskDoc.data() || {};
    if (task.uid && task.uid !== uid) return res.status(403).json({ error: "Forbidden" });

    const snap = await db.collection("images")
      .where("mjTaskId", "==", taskId)
      .limit(8)
      .get();

    const unsorted = snap.docs.map((d) => {
      const v = d.data() || {};
      const created =
        v.createdAt?.toDate ? v.createdAt.toDate() :
        (typeof v.createdAt === "string" ? new Date(v.createdAt) : null);

      return {
        id: d.id,
        url: v.url || null,
        thumbUrl: v.thumbUrl || null,
        tinyUrl: v.tinyUrl || null,
        upscaledUrl: v.upscaledUrl || null,
        path: v.path || null,
        prompt: v.prompt || null,
        model: v.model || null,
        state: v.state || "base-image",
        mimeType: v.mimeType || null,
        createdAt: created ? created.toISOString() : null,
        _createdAtDate: created,
        uid: v.uid || v.userId || null,
      };
    });

    const items = unsorted
      .sort((a, b) => {
        const ta = a._createdAtDate ? a._createdAtDate.getTime() : 0;
        const tb = b._createdAtDate ? b._createdAtDate.getTime() : 0;
        return ta - tb;
      })
      .map(({ _createdAtDate, ...rest }) => rest)
      .slice(0, 4);

    const status = String(task.status || (items.length ? "COMPLETED" : "PROCESSING")).toUpperCase();
    return ok(res, { items, status });
  } catch (e) {
    console.error("[getMidjourneyResult] error:", e?.message || e);
    return ok(res, { items: [], status: "PROCESSING" });
  }
}
