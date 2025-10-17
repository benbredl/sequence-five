import sharp from "sharp";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Given a GCS object path (where your full image lives), download, create previews,
 * upload, and update Firestore doc with preview URLs.
 */
export async function generatePreviewsFor(path, imageId) {
  // Skip if this is already a preview
  if (/\/previews\//.test(path) || /_thumb\.jpg$|_tiny\.jpg$/i.test(path)) return;

  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return;

  const [buffer] = await file.download();

  // Build two outputs
  const thumb = await sharp(buffer)
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ mozjpeg: true, quality: 45, progressive: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  const tiny = await sharp(buffer)
    .resize({ width: 24, withoutEnlargement: true })
    .jpeg({ mozjpeg: true, quality: 35, progressive: true, chromaSubsampling: "4:2:0" })
    .toBuffer();

  // Paths alongside original
  const baseNoExt = path.replace(/\.[^.]+$/, "");
  const thumbPath = `${baseNoExt}_thumb.jpg`;
  const tinyPath = `${baseNoExt}_tiny.jpg`;

  // Upload with download tokens + long-term caching
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

  // Update Firestore doc (id passed in when we saved original)
  if (imageId) {
    await db.collection("images").doc(imageId).set(
      { thumbUrl, tinyUrl },
      { merge: true }
    );
  }
}
