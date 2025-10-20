// functions/firebase.js
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId =
  process.env.GCLOUD_PROJECT ||
  (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : null);

const bucketName =
  process.env.FIREBASE_STORAGE_BUCKET ||
  (projectId ? `${projectId}.firebasestorage.app` : undefined);

if (!bucketName) {
  console.warn("No FIREBASE_STORAGE_BUCKET provided; initialization may fail without a bucket.");
  initializeApp();
} else {
  initializeApp({ storageBucket: bucketName });
}

export const db = getFirestore();
export const FieldValueServer = FieldValue;
export const bucket = getStorage().bucket();
