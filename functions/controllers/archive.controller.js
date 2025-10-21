// functions/controllers/archive.controller.js
import { db } from "../firebase.js";
import { err, ok } from "../utils/http.js";

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
        path: v.path || null,
        prompt: v.prompt || null,
        enhancedPrompt: v.enhancedPrompt || null,
        modelUsed: v.modelUsed || null,
        type: v.type || null,
        mimeType: v.mimeType || null,
        width: v.width ?? null,    // <- pass through intrinsic width
        height: v.height ?? null,  // <- pass through intrinsic height
        createdAt: created
      };
    });

    const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;
    return ok(res, { items, nextCursor });
  } catch (e) {
    return err(res, e);
  }
}
