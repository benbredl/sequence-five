import { Router } from "express";
import { db } from "../firebase.js";

const router = Router();

/**
 * Firestore layout:
 *  - images/{imageId}                                   (already used by your app)
 *  - storyboards/{storyboardId} -> { title, description, createdAt }
 *  - storyboards/{storyboardId}/items/{imageId} -> { imageId, addedAt }
 *
 * Notes:
 *  - We use the imageId as the item doc id to prevent duplicates.
 *  - Aggregation count() is used to return item counts on list.
 */

// Create storyboard
router.post("/api/storyboards", async (req, res) => {
  try {
    const { title, description } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Missing title" });
    }
    const doc = await db.collection("storyboards").add({
      title: title.trim(),
      description: (description || "").trim(),
      createdAt: new Date()
    });
    return res.json({ id: doc.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// List storyboards (with item counts)
router.get("/api/storyboards", async (_req, res) => {
  try {
    const snap = await db.collection("storyboards").orderBy("createdAt", "desc").get();
    const storyboards = [];

    for (const doc of snap.docs) {
      const v = doc.data() || {};
      // Firestore aggregation count (Admin SDK)
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

    return res.json({ storyboards });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Get a storyboard with items (joins basic image info incl. previews if present)
router.get("/api/storyboard", async (req, res) => {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing storyboard id" });

    const sbRef = db.collection("storyboards").doc(id);
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return res.status(404).json({ error: "Storyboard not found" });

    const sb = sbDoc.data() || {};
    const itemsSnap = await sbRef.collection("items").orderBy("addedAt", "desc").get();
    const imageIds = itemsSnap.docs.map((d) => d.id);

    // Batch-load image docs in small chunks
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
        thumbUrl: img.thumbUrl || null, // may be null if previews not generated yet
        tinyUrl: img.tinyUrl || null,
        enhancedPrompt: img.enhancedPrompt || null,
        modelUsed: img.modelUsed || null,
        mimeType: img.mimeType || null
      };
    });

    return res.json({
      id,
      title: sb.title || "",
      description: sb.description || "",
      createdAt: sb.createdAt?.toDate ? sb.createdAt.toDate().toISOString() : sb.createdAt || null,
      items
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Add image to storyboard
router.post("/api/storyboard/add", async (req, res) => {
  try {
    const { storyboardId, imageId } = req.body || {};
    if (!storyboardId || !imageId) {
      return res.status(400).json({ error: "storyboardId and imageId required" });
    }

    // Ensure storyboard exists
    const sbRef = db.collection("storyboards").doc(String(storyboardId));
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return res.status(404).json({ error: "Storyboard not found" });

    // Ensure image exists
    const imgRef = db.collection("images").doc(String(imageId));
    const imgDoc = await imgRef.get();
    if (!imgDoc.exists) return res.status(404).json({ error: "Image not found" });

    // Upsert item (doc id == imageId prevents duplicates)
    await sbRef
      .collection("items")
      .doc(String(imageId))
      .set({ imageId: String(imageId), addedAt: new Date() }, { merge: true });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Remove image from storyboard
router.post("/api/storyboard/remove", async (req, res) => {
  try {
    const { storyboardId, imageId } = req.body || {};
    if (!storyboardId || !imageId) {
      return res.status(400).json({ error: "storyboardId and imageId required" });
    }

    const itemRef = db
      .collection("storyboards")
      .doc(String(storyboardId))
      .collection("items")
      .doc(String(imageId));

    await itemRef.delete();
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Delete storyboard (and its items)
router.post("/api/storyboard/delete", async (req, res) => {
  try {
    const { storyboardId } = req.body || {};
    if (!storyboardId) return res.status(400).json({ error: "storyboardId required" });

    const sbRef = db.collection("storyboards").doc(String(storyboardId));
    const sbDoc = await sbRef.get();
    if (!sbDoc.exists) return res.status(404).json({ error: "Storyboard not found" });

    // Delete all items then the storyboard document
    const itemsSnap = await sbRef.collection("items").get();
    const batch = db.batch();
    itemsSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(sbRef);
    await batch.commit();

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

export default router;
