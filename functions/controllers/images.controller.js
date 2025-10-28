// functions/controllers/images.controller.js
import { generateFromText, generateFromImage } from "../services/gemini.js";
import { saveImageAndRecord, deleteImageCompletely } from "../services/storage.js";
import { bad, err, ok } from "../utils/http.js";
import { pricingCatalog, BillingConfigError } from "../services/billing.js";
import { db, FieldValueServer } from "../firebase.js"; // add FieldValueServer for deletions

/** Robust base64url-safe JWT payload decode (no signature verify). */
function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Try to get a UID: req.user.uid -> custom headers -> bearer payload -> body (uid/userId)
function getUidFromRequest(req) {
  if (req?.user?.uid && String(req.user.uid).trim()) return String(req.user.uid).trim();

  const headerKeys = [
    "x-user-uid",
    "x-user-id",      // legacy alias
    "x-firebase-uid",
    "x-uid",
    "x-user",
    "x-client-uid"
  ];
  for (const k of headerKeys) {
    const v = req.headers?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  const auth = req.headers?.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme === "Bearer" && token) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      const uid = (payload.user_id || payload.sub || payload.uid || "").toString().trim();
      if (uid) return uid;
    }
  }

  const bodyAliases = ["uid", "userId", "firebaseUid"]; // accept legacy
  for (const key of bodyAliases) {
    const v = req.body?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  return null;
}

/**
 * POST /api/generate-image
 * Body:
 *  - prompt (string)
 *  - image?: { dataUrl: "data:mime;base64,..." }
 *
 * We REQUIRE a uid for generator to avoid null-owned docs.
 */
export async function postGenerateImage(req, res) {
  try {
    pricingCatalog();
  } catch (e) {
    if (e instanceof BillingConfigError) {
      return res
        .status(500)
        .json({ error: "Billing configuration missing. Please contact admin." });
    }
    return err(res, e);
  }

  try {
    const { prompt, image } = req.body || {};
    const promptStr = typeof prompt === "string" ? prompt.trim() : "";
    if (!promptStr) return bad(res, "Missing prompt");

    const uid = getUidFromRequest(req);
    if (!uid) {
      return bad(
        res,
        "Missing user identity. Send a UID via one of: header x-user-uid / x-firebase-uid, a Bearer Firebase ID token, or body.uid (legacy: body.userId)."
      );
    }

    const hasImage =
      image && typeof image.dataUrl === "string" && /^data:/.test(image.dataUrl);

    const model = "gemini-2.5-flash-image";
    const state = "base-image";

    // Image-to-Image
    if (hasImage) {
      const m = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return bad(res, "Invalid dataUrl");
      const baseMime = m[1];
      const base64Data = m[2];

      const finalPrompt = promptStr;
      const { mimeType, base64 } = await generateFromImage(baseMime, base64Data, finalPrompt);

      const { archiveUrl, id } = await saveImageAndRecord({
        mimeType,
        base64,
        prompt: finalPrompt,
        model,
        state
      });

      if (id) {
        await db.collection("images").doc(id).set(
          { uid, userId: FieldValueServer.delete() }, // remove legacy field
          { merge: true }
        );
      }

      return ok(res, { mimeType, imageBase64: base64, archiveUrl, id });
    }

    // Text-to-Image
    const finalPrompt = promptStr;
    const { mimeType, base64 } = await generateFromText(finalPrompt);
    const { archiveUrl, id } = await saveImageAndRecord({
      mimeType,
      base64,
      prompt: finalPrompt,
      model,
      state
    });

    if (id) {
      await db.collection("images").doc(id).set(
        { uid, userId: FieldValueServer.delete() }, // remove legacy field
        { merge: true }
      );
    }

    return ok(res, { mimeType, imageBase64: base64, archiveUrl, id });
  } catch (e) {
    return err(res, e);
  }
}

export async function postDeleteImage(req, res) {
  try {
    const { imageId } = req.body || {};
    if (!imageId) return bad(res, "imageId required");
    const out = await deleteImageCompletely(String(imageId));
    return ok(res, out);
  } catch (e) {
    return err(res, e);
  }
}
