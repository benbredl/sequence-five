import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import app from "./app.js";

const GOOGLE_API_KEY = defineSecret("GOOGLE_API_KEY");
const ENHANCOR_API_KEY = defineSecret("ENHANCOR_API_KEY");
const BASIC_AUTH_USER = defineSecret("BASIC_AUTH_USER");
const BASIC_AUTH_PASS = defineSecret("BASIC_AUTH_PASS");
const FIREBASE_STORAGE_BUCKET = defineSecret("FIREBASE_STORAGE_BUCKET");
const PRICE_GEMINI_TEXT_INPUT_USD_PER_1M  = defineSecret("PRICE_GEMINI_TEXT_INPUT_USD_PER_1M");
const PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M = defineSecret("PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M");
const PRICE_GEMINI_IMAGE_USD_PER_IMAGE    = defineSecret("PRICE_GEMINI_IMAGE_USD_PER_IMAGE");
const PRICE_ENHANCOR_USD_PER_1K           = defineSecret("PRICE_ENHANCOR_USD_PER_1K");
const PRICE_NOTE = defineSecret("PRICE_NOTE");


export const web = onRequest(
  {
    region: "europe-west3",
    secrets: [
      GOOGLE_API_KEY,
      ENHANCOR_API_KEY,
      BASIC_AUTH_USER,
      BASIC_AUTH_PASS,
      FIREBASE_STORAGE_BUCKET,
      PRICE_GEMINI_TEXT_INPUT_USD_PER_1M,
      PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M,
      PRICE_GEMINI_IMAGE_USD_PER_IMAGE,
      PRICE_ENHANCOR_USD_PER_1K,
      PRICE_NOTE
    ]
  },
  app
);

import { onObjectFinalized } from "firebase-functions/v2/storage";
import { generatePreviewsFor } from "./services/previews.js";
import { db } from "./firebase.js";

export const previews = onObjectFinalized(
  { region: "europe-west3" },
  async (event) => {
    const path = event.data?.name;
    if (!path || !/^images\//.test(path)) return;

    let imageId = null;
    const snap = await db.collection("images").where("path", "==", path).limit(1).get();
    if (!snap.empty) imageId = snap.docs[0].id;

    await generatePreviewsFor(path, imageId);
  }
);
