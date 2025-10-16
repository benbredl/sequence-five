import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import app from "./app.js";

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const GOOGLE_API_KEY = defineSecret("GOOGLE_API_KEY");
const BASIC_AUTH_USER = defineSecret("BASIC_AUTH_USER");
const BASIC_AUTH_PASS = defineSecret("BASIC_AUTH_PASS");
const FIREBASE_STORAGE_BUCKET = defineSecret("FIREBASE_STORAGE_BUCKET"); // strongly recommended

export const web = onRequest(
  {
    region: "europe-west3",
    secrets: [
      OPENAI_API_KEY,
      GOOGLE_API_KEY,
      BASIC_AUTH_USER,
      BASIC_AUTH_PASS,
      FIREBASE_STORAGE_BUCKET
    ]
  },
  app
);

import { onObjectFinalized } from "firebase-functions/v2/storage";
import { generatePreviewsFor } from "./services/previews.js";
import { db } from "./firebase.js";

// Runs when any object is finalized in your bucket
export const previews = onObjectFinalized(
  { region: "europe-west3" },
  async (event) => {
    const path = event.data?.name;
    if (!path || !/^images\//.test(path)) return;

    // Try to look up the Firestore image doc by matching path (quick join).
    let imageId = null;
    const snap = await db.collection("images").where("path", "==", path).limit(1).get();
    if (!snap.empty) imageId = snap.docs[0].id;

    await generatePreviewsFor(path, imageId);
  }
);
