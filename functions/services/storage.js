// functions/services/storage.js
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { db, bucket, FieldValueServer } from "../firebase.js";

function extFromMime(m) {
  if (!m) return "png";
  const s = m.toLowerCase();
  if (s.includes("png")) return "png";
  if (s.includes("jpeg") || s.includes("jpg")) return "jpg";
  if (s.includes("webp")) return "webp";
  return "png";
}

function yyyymmdd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export async function saveImageAndRecord({ mimeType, base64, prompt, model, state }) {
  if (!base64) return { archiveUrl: null, id: null };

  // MASTER: never re-encode here (this path is used by generator; we keep Gemini original)
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
  const archiveUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  await db.collection("images").doc(id).set({
    url: archiveUrl,
    path,
    prompt,
    model: model || "gemini-2.5-flash-image",
    state: state || "base-image",
    mimeType,
    createdAt: FieldValueServer.serverTimestamp()
  });

  return { archiveUrl, galleryUrl: archiveUrl, id };
}

/**
 * Save an upscaled variant for an existing image.
 * - Writes to `${baseNoExt}_upscaled.<ext>` (keeps ext from mime)
 * - Updates image doc with { upscaledUrl, upscaledPath } (state promotion is done by controller).
 */
export async function saveUpscaledVariantFor(imageId, mimeType, buffer) {
  if (!imageId) throw new Error("imageId required");
  const imgRef = db.collection("images").doc(String(imageId));
  const imgDoc = await imgRef.get();
  if (!imgDoc.exists) throw new Error("Image not found");

  const data = imgDoc.data() || {};
  const srcPath = data.path;
  if (!srcPath) throw new Error("Image has no storage path");
  const baseNoExt = srcPath.replace(/\.[^.]+$/, "");

  const ext = extFromMime(mimeType || "image/jpeg");
  const upPath = `${baseNoExt}_upscaled.${ext}`;
  const file = bucket.file(upPath);
  const token = uuidv4();

  await file.save(buffer, {
    metadata: {
      contentType: mimeType || "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token }
    },
    resumable: false
  });

  const encodedPath = encodeURIComponent(upPath);
  const upscaledUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  await imgRef.set(
    {
      upscaledUrl,
      upscaledPath: upPath,
      updatedAt: FieldValueServer.serverTimestamp()
    },
    { merge: true }
  );

  return { upscaledUrl, upscaledPath: upPath };
}

export async function deleteImageCompletely(imageId) {
  if (!imageId) throw new Error("imageId required");

  let imgRef, path, upscaledPath;
  try {
    imgRef = db.collection("images").doc(String(imageId));
    const imgDoc = await imgRef.get();
    if (!imgDoc.exists) throw new Error("Image not found");
    const data = imgDoc.data() || {};
    path = data.path;
    upscaledPath = data.upscaledPath || null;
    if (!path) throw new Error("Image has no storage path");
  } catch (e) {
    e.message = `stage:read-image-doc → ${e.message}`;
    throw e;
  }

  try {
    const baseNoExt = path.replace(/\.[^.]+$/, "");
    const toDeletePaths = [path, `${baseNoExt}_thumb.jpg`, `${baseNoExt}_tiny.jpg`];
    if (upscaledPath) toDeletePaths.push(upscaledPath);
    else toDeletePaths.push(`${baseNoExt}_upscaled.jpg`);

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

  try {
    await imgRef.delete();
  } catch (e) {
    e.message = `stage:delete-image-doc → ${e.message}`;
    throw e;
  }

  return { ok: true };
}

/**
 * Save a user-uploaded image:
 * - MASTER: saved AS-IS (no server re-encode). Client already resized max 1344 long edge.
 * - THUMB/TINY: always JPEG, mozjpeg on, generated from the uploaded buffer.
 */
export async function saveUserUploadVariants(inputMime, inputBuffer) {
  const id = uuidv4();
  const folder = yyyymmdd();

  const ext = extFromMime(inputMime);
  const basePath = `images/${folder}/${id}.${ext}`;
  const thumbPath = `images/${folder}/${id}_thumb.jpg`;
  const tinyPath = `images/${folder}/${id}_tiny.jpg`;

  // MASTER: save the client-resized buffer as-is (no re-encode here)
  const baseFile = bucket.file(basePath);
  const tokenBase = uuidv4();
  await baseFile.save(inputBuffer, {
    metadata: {
      contentType: inputMime || "image/png",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: tokenBase }
    },
    resumable: false
  });

  // THUMB/TINY derived with mozjpeg
  const thumbJpeg = await sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 768, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  const tinyJpeg = await sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 320, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 72, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  const thumbFile = bucket.file(thumbPath);
  const tinyFile = bucket.file(tinyPath);
  const tokenThumb = uuidv4();
  const tokenTiny = uuidv4();

  await Promise.all([
    thumbFile.save(thumbJpeg, {
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: tokenThumb }
      },
      resumable: false
    }),
    tinyFile.save(tinyJpeg, {
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: tokenTiny }
      },
      resumable: false
    })
  ]);

  const enc = (p) => encodeURIComponent(p);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${enc(basePath)}?alt=media&token=${tokenBase}`;
  const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${enc(thumbPath)}?alt=media&token=${tokenThumb}`;
  const tinyUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${enc(tinyPath)}?alt=media&token=${tokenTiny}`;

  return {
    id,
    path: basePath,
    thumbPath,
    tinyPath,
    url,
    thumbUrl,
    tinyUrl
  };
}
