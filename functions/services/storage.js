// functions/services/storage.js
import { v4 as uuidv4 } from "uuid";
import { db, bucket, FieldValueServer } from "../firebase.js";

function extFromMime(m) {
  if (!m) return "png";
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("webp")) return "webp";
  return "png";
}
function yyyymmdd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

/** Save original image to Storage and create Firestore record. */
export async function saveImageAndRecord({ mimeType, base64, prompt, enhancedPrompt, modelUsed, type }) {
  if (!base64) return { galleryUrl: null, id: null };

  const buffer = Buffer.from(base64, "base64");
  const id = uuidv4();
  const ext = extFromMime(mimeType);
  const folder = yyyymmdd();
  const path = `images/${folder}/${id}.${ext}`;
  const file = bucket.file(path);
  const token = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token }
    },
    resumable: false
  });

  const encodedPath = encodeURIComponent(path);
  const galleryUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  await db.collection("images").doc(id).set({
    url: galleryUrl,
    path,
    prompt,
    enhancedPrompt,
    modelUsed,
    type: type || null,
    mimeType,
    createdAt: FieldValueServer.serverTimestamp()
  });

  return { galleryUrl, id };
}

/** Delete from Storage + Firestore + any storyboard references. */
export async function deleteImageCompletely(imageId) {
  if (!imageId) throw new Error("imageId required");

  // Read the image doc
  let imgRef, path;
  try {
    imgRef = db.collection("images").doc(String(imageId));
    const imgDoc = await imgRef.get();
    if (!imgDoc.exists) throw new Error("Image not found");
    const data = imgDoc.data() || {};
    path = data.path;
    if (!path) throw new Error("Image has no storage path");
  } catch (e) {
    e.message = `stage:read-image-doc → ${e.message}`;
    throw e;
  }

  // Delete from Storage (original + previews). Ignore NotFound.
  try {
    const baseNoExt = path.replace(/\.[^.]+$/, "");
    const toDeletePaths = [path, `${baseNoExt}_thumb.jpg`, `${baseNoExt}_tiny.jpg`];
    await Promise.all(
      toDeletePaths.map(async (p) => {
        try {
          await bucket.file(p).delete();
        } catch (err) {
          const code = (err && (err.code || err.statusCode)) || err?.errors?.[0]?.reason;
          if (code !== 404 && code !== "notFound") {
            throw new Error(`storage delete failed for ${p}: ${err.message || err}`);
          }
        }
      })
    );
  } catch (e) {
    e.message = `stage:delete-storage → ${e.message}`;
    throw e;
  }

  // Remove from ALL storyboards.
  try {
    const cgSnap = await db.collectionGroup("items").where("imageId", "==", String(imageId)).get();
    if (!cgSnap.empty) {
      const refs = cgSnap.docs.map((d) => d.ref);
      const CHUNK = 450;
      for (let i = 0; i < refs.length; i += CHUNK) {
        const batch = db.batch();
        const slice = refs.slice(i, i + CHUNK);
        slice.forEach((ref) => batch.delete(ref));
        await batch.commit();
      }
    }
  } catch (e) {
    if (String(e).includes("FAILED_PRECONDITION")) {
      try {
        const boardsSnap = await db.collection("storyboards").select().get();
        if (!boardsSnap.empty) {
          const refs = boardsSnap.docs.map((d) =>
            db.collection("storyboards").doc(d.id).collection("items").doc(String(imageId))
          );
          const CHUNK = 450;
          for (let i = 0; i < refs.length; i += CHUNK) {
            const batch = db.batch();
            const slice = refs.slice(i, i + CHUNK);
            slice.forEach((ref) => batch.delete(ref));
            await batch.commit();
          }
        }
      } catch (fallbackErr) {
        fallbackErr.message = `stage:delete-storyboard-items-fallback → ${fallbackErr.message}`;
        throw fallbackErr;
      }
    } else {
      e.message = `stage:delete-storyboard-items → ${e.message}`;
      throw e;
    }
  }

  // Delete the image doc itself
  try {
    await imgRef.delete();
  } catch (e) {
    e.message = `stage:delete-image-doc → ${e.message}`;
    throw e;
  }

  return { ok: true };
}
