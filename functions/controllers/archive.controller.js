// functions/controllers/archive.controller.js
import { db } from "../firebase.js";
import { bad, err, ok } from "../utils/http.js";
import { saveUserUploadVariants } from "../services/storage.js";

export async function getArchive(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "24", 10) || 24, 60);
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    let ref = db.collection("images").orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
      const curDoc = await db.collection("images").doc(cursor).get();
      if (curDoc.exists) ref = ref.startAfter(curDoc);
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
        createdAt: created
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
      state: "base-image"
    });
  } catch (e) {
    return err(res, e);
  }
}
