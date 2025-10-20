// functions/controllers/storyboards.controller.js
import { db } from "../firebase.js";
import { bad, err, ok } from "../utils/http.js";

// Create storyboard
export async function createStoryboard(req, res) {
  try {
    const { title, description } = req.body || {};
    if (!title || typeof title !== "string") {
      return bad(res, "Missing title");
    }
    const doc = await db.collection("storyboards").add({
      title: title.trim(),
      description: (description || "").trim(),
      createdAt: new Date()
    });
    return ok(res, { id: doc.id });
  } catch (e) {
    return err(res, e);
  }
}

// List storyboards with counts
export async function listStoryboards(_req, res) {
  try {
    const snap = await db.collection("storyboards").orderBy("createdAt", "desc").get();
    const storyboards = [];
    for (const doc of snap.docs) {
      const v = doc.data() || {};
      const agg = await db
        .collection("storyboards")
        .doc(doc.id)
        .collection("items")
        .count()
        .get();

      storyboards.push({
        id: doc.id,
        title: v.title || "",
        description: v.description || "",
        createdAt: v.createdAt?.toDate ? v.createdAt.toDate().toISOString() : v.createdAt || null,
        itemCount: agg.data().count || 0
      });
    }
    return ok(res, { storyboards });
  } catch (e) {
    return err(res, e);
  }
}

// Get storyboard + items (with image joins)
export async function getStoryboard(req, res) {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return bad(res, "Missing storyboard id");

    const sbRef = db.collection("storyboards").doc(id);
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return err(res, new Error("Storyboard not found"), 404);

    const sb = sbDoc.data() || {};
    const itemsSnap = await sbRef.collection("items").orderBy("addedAt", "desc").get();
    const imageIds = itemsSnap.docs.map((d) => d.id);

    const imagesById = {};
    if (imageIds.length) {
      for (let i = 0; i < imageIds.length; i += 10) {
        const chunk = imageIds.slice(i, i + 10);
        const reads = await Promise.all(
          chunk.map((iid) => db.collection("images").doc(iid).get())
        );
        for (const r of reads) {
          if (r.exists) imagesById[r.id] = r.data();
        }
      }
    }

    const items = itemsSnap.docs.map((d) => {
      const itemData = d.data() || {};
      const img = imagesById[d.id] || {};
      return {
        imageId: d.id,
        addedAt: itemData.addedAt?.toDate
          ? itemData.addedAt.toDate().toISOString()
          : itemData.addedAt || null,
        url: img.url || null,
        thumbUrl: img.thumbUrl || null,
        tinyUrl: img.tinyUrl || null,
        enhancedPrompt: img.enhancedPrompt || null,
        modelUsed: img.modelUsed || null,
        mimeType: img.mimeType || null
      };
    });

    return ok(res, {
      id,
      title: sb.title || "",
      description: sb.description || "",
      createdAt: sb.createdAt?.toDate ? sb.createdAt.toDate().toISOString() : sb.createdAt || null,
      items
    });
  } catch (e) {
    return err(res, e);
  }
}

// Add image to storyboard
export async function addToStoryboard(req, res) {
  try {
    const { storyboardId, imageId } = req.body || {};
    if (!storyboardId || !imageId) {
      return bad(res, "storyboardId and imageId required");
    }

    const sbRef = db.collection("storyboards").doc(String(storyboardId));
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return err(res, new Error("Storyboard not found"), 404);

    const imgRef = db.collection("images").doc(String(imageId));
    const imgDoc = await imgRef.get();
    if (!imgDoc.exists) return err(res, new Error("Image not found"), 404);

    await sbRef
      .collection("items")
      .doc(String(imageId))
      .set({ imageId: String(imageId), addedAt: new Date() }, { merge: true });

    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e);
  }
}

// Remove image from storyboard
export async function removeFromStoryboard(req, res) {
  try {
    const { storyboardId, imageId } = req.body || {};
    if (!storyboardId || !imageId) {
      return bad(res, "storyboardId and imageId required");
    }
    const itemRef = db
      .collection("storyboards")
      .doc(String(storyboardId))
      .collection("items")
      .doc(String(imageId));
    await itemRef.delete();
    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e);
  }
}

// Delete storyboard and its items
export async function deleteStoryboard(req, res) {
  try {
    const { storyboardId } = req.body || {};
    if (!storyboardId) return bad(res, "storyboardId required");

    const sbRef = db.collection("storyboards").doc(String(storyboardId));
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return err(res, new Error("Storyboard not found"), 404);

    const itemsSnap = await sbRef.collection("items").get();
    const batch = db.batch();
    itemsSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(sbRef);
    await batch.commit();

    return ok(res, { ok: true });
  } catch (e) {
    return err(res, e);
  }
}
