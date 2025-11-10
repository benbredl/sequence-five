// functions/services/previews.js
import sharp from "sharp";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Helpers to decide whether we should skip.
 */
function isPreviewAssetPath(path) {
  // already a derived preview or inside a previews folder
  return /\/previews\//i.test(path) || /_(thumb|tiny)\.jpg$/i.test(path);
}

function isUpscaledPath(path) {
  // either stored in a dedicated upscaled prefix OR named *_upscaled.<ext>
  return /(?:^|\/)upscaled\//i.test(path) || /_upscaled(?:\.[a-z0-9]+)$/i.test(path);
}

/**
 * Given a GCS object path (where your full image lives), download, create previews,
 * upload, and update Firestore doc with preview URLs.
 *
 * IMPORTANT:
 * - Skips if the object is already a preview (_thumb/_tiny) or inside /previews/
 * - Skips for UPSCALED masters so we don't create *_upscaled_thumb.jpg / *_upscaled_tiny.jpg
 */
export async function generatePreviewsFor(path, imageId) {
  // Hard guards — do nothing for previews or upscaled files
  if (isPreviewAssetPath(path) || isUpscaledPath(path)) return;

  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return;

  const [buffer] = await file.download();

  // Create small previews for fast progressive display
  const thumb = await sharp(buffer)
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ mozjpeg: true, quality: 45, progressive: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  const tiny = await sharp(buffer)
    .resize({ width: 24, withoutEnlargement: true })
    .jpeg({ mozjpeg: true, quality: 35, progressive: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  const baseNoExt = path.replace(/\.[^.]+$/, "");
  const thumbPath = `${baseNoExt}_thumb.jpg`;
  const tinyPath = `${baseNoExt}_tiny.jpg`;

  const t1 = uuidv4();
  const t2 = uuidv4();

  await bucket.file(thumbPath).save(thumb, {
    metadata: {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: t1 }
    },
    resumable: false
  });

  await bucket.file(tinyPath).save(tiny, {
    metadata: {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: t2 }
    },
    resumable: false
  });

  const encThumb = encodeURIComponent(thumbPath);
  const encTiny = encodeURIComponent(tinyPath);
  const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encThumb}?alt=media&token=${t1}`;
  const tinyUrl  = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encTiny}?alt=media&token=${t2}`;

  if (imageId) {
    await db.collection("images").doc(imageId).set(
      { thumbUrl, tinyUrl },
      { merge: true }
    );
  }
}
