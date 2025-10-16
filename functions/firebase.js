import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Strongly recommend setting FIREBASE_STORAGE_BUCKET as a secret.
const projectId =
  process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : null);

const bucketName =
  process.env.FIREBASE_STORAGE_BUCKET ||
  // Fallbacks: prefer new naming; if you know the exact bucket, set the secret to avoid guesswork.
  (projectId ? `${projectId}.firebasestorage.app` : undefined);

if (!bucketName) {
  // Final fallback; avoids crash in local emulation if ENV not present.
  console.warn("No FIREBASE_STORAGE_BUCKET provided; initialization may fail without a bucket.");
  initializeApp();
} else {
  initializeApp({ storageBucket: bucketName });
}

export const db = getFirestore();
export const FieldValueServer = FieldValue;
export const bucket = getStorage().bucket();
