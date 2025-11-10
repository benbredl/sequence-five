import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import app from "./app.js";

const GOOGLE_API_KEY = defineSecret("GOOGLE_API_KEY");
const ENHANCOR_API_KEY = defineSecret("ENHANCOR_API_KEY");
const APIFRAME_API_KEY = defineSecret("APIFRAME_API_KEY");
const BASIC_AUTH_USER = defineSecret("BASIC_AUTH_USER");
const BASIC_AUTH_PASS = defineSecret("BASIC_AUTH_PASS");
const FIREBASE_STORAGE_BUCKET = defineSecret("FIREBASE_STORAGE_BUCKET");
const FIREBASE_PROJECT_ID = defineSecret("FIREBASE_PROJECT_ID");
const FIREBASE_WEB_API_KEY = defineSecret("FIREBASE_WEB_API_KEY");
const FIREBASE_AUTH_DOMAIN = defineSecret("FIREBASE_AUTH_DOMAIN");

const PRICE_GEMINI_TEXT_INPUT_USD_PER_1M  = defineSecret("PRICE_GEMINI_TEXT_INPUT_USD_PER_1M");
const PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M = defineSecret("PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M");
const PRICE_GEMINI_IMAGE_USD_PER_IMAGE    = defineSecret("PRICE_GEMINI_IMAGE_USD_PER_IMAGE");
const PRICE_ENHANCOR_USD_PER_1K           = defineSecret("PRICE_ENHANCOR_USD_PER_1K");
const PRICE_MIDJOURNEY_IMAGE_USD_PER_JOB  = defineSecret("PRICE_MIDJOURNEY_IMAGE_USD_PER_JOB");
const PRICE_NOTE = defineSecret("PRICE_NOTE");

export const web = onRequest(
  {
    region: "europe-west3",
    secrets: [
      GOOGLE_API_KEY,
      ENHANCOR_API_KEY,
      APIFRAME_API_KEY,
      BASIC_AUTH_USER,
      BASIC_AUTH_PASS,
      FIREBASE_STORAGE_BUCKET,
      FIREBASE_PROJECT_ID,
      FIREBASE_WEB_API_KEY,
      FIREBASE_AUTH_DOMAIN,
      PRICE_GEMINI_TEXT_INPUT_USD_PER_1M,
      PRICE_GEMINI_TEXT_OUTPUT_USD_PER_1M,
      PRICE_GEMINI_IMAGE_USD_PER_IMAGE,
      PRICE_ENHANCOR_USD_PER_1K,
      PRICE_MIDJOURNEY_IMAGE_USD_PER_JOB,
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
