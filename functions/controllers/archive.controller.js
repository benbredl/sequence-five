// functions/controllers/archive.controller.js
import { db } from "../firebase.js";
import { bad, err, ok } from "../utils/http.js";
import { saveUserUploadVariants } from "../services/storage.js";

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

// Helper duplicated here to avoid changing shared libs; tiny & self-contained.
function getUidFromRequest(req) {
  if (req?.user?.uid) return String(req.user.uid);

  const headerKeys = ["x-user-uid", "x-user-id", "x-firebase-uid", "x-uid", "x-user"];
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

  // Accept both for backward compatibility
  if (typeof req.body?.uid === "string" && req.body.uid.trim()) return req.body.uid.trim();
  if (typeof req.body?.userId === "string" && req.body.userId.trim()) return req.body.userId.trim();

  return null;
}

export async function getArchive(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "24", 10) || 24, 60);
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const myParam = String(req.query.my || "").toLowerCase();
    const wantMine = myParam === "1" || myParam === "true" || myParam === "yes";

    let ref;

    if (wantMine) {
      // Server-side filter by the caller's uid
      const uid = getUidFromRequest(req);
      if (!uid) {
        // No identity -> no personal images
        return ok(res, { items: [], nextCursor: null });
      }
      ref = db
        .collection("images")
        .where("uid", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (cursor) {
        const curDoc = await db.collection("images").doc(cursor).get();
        if (curDoc.exists) ref = ref.startAfter(curDoc);
      }
    } else {
      // Global archive
      ref = db.collection("images").orderBy("createdAt", "desc").limit(limit);
      if (cursor) {
        const curDoc = await db.collection("images").doc(cursor).get();
        if (curDoc.exists) ref = ref.startAfter(curDoc);
      }
    }

    const snap = await ref.get();
    const items = snap.docs.map((d) => {
      const v = d.data() || {};
      const created =
        v.createdAt?.toDate ? v.createdAt.toDate().toISOString() : v.createdAt || null;
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
        createdAt: created,
        uid: v.uid || v.userId || null, // prefer new field; fall back to legacy
      };
    });
    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
    return ok(res, { items, nextCursor });
  } catch (e) {
    return err(res, e);
  }
}

/**
 * POST /api/archive/upload
 * Body: { name?: string, image: { dataUrl: string } }
 * Saves master (as-is, already-resized client-side) + thumb + tiny; creates Firestore doc.
 * Does NOT store _dlToken, width/height or source.
 */
export async function postArchiveUpload(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const dataUrl = String(req.body?.image?.dataUrl || "");
    if (!dataUrl || !/^data:image\/[a-z0-9+.\-]+;base64,/i.test(dataUrl)) {
      return bad(res, "image.dataUrl (data:image/*;base64,...) required");
    }

    // Decode data URL (keep original mime)
    const m = /^data:(image\/[a-z0-9+.\-]+);base64,(.*)$/i.exec(dataUrl);
    const mimeType = m?.[1] || "image/png";
    const base64 = m?.[2] || "";
    const buf = Buffer.from(base64, "base64");

    // Write master (no re-encode) + mozjpeg thumbs
    const {
      id,
      path,
      url,
      thumbPath,
      thumbUrl,
      tinyPath,
      tinyUrl
    } = await saveUserUploadVariants(mimeType, buf);

    // Current user's UID (from header/bearer/body)
    const uid = getUidFromRequest(req);

    // Firestore document aligned with generator images, without _dlToken/width/height/source
    const doc = {
      url,
      thumbUrl,
      tinyUrl,
      upscaledUrl: null,
      path,
      thumbPath,
      tinyPath,
      prompt: null,
      model: "upload",
      state: "base-image",
      mimeType,
      uid: uid || null, // <-- owner uid (null if not provided)
      originalFileName: name || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("images").doc(id).set(doc);

    return ok(res, {
      id,
      url,
      thumbUrl,
      tinyUrl,
      upscaledUrl: null,
      createdAt: doc.createdAt.toISOString(),
      state: "base-image",
      uid: doc.uid || null,
    });
  } catch (e) {
    return err(res, e);
  }
}
