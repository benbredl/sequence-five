// functions/controllers/billing.controller.js
import { db } from "../firebase.js";
import { ok, err } from "../utils/http.js";

export async function getSummary(req, res) {
  try {
    const { from, to } = req.query || {};
    const fromDate = from ? new Date(from + "T00:00:00.000Z") : new Date(Date.now() - 14 * 864e5);
    const toDate   = to   ? new Date(to   + "T23:59:59.999Z") : new Date();

    const snap = await db.collection("billing_events")
      .where("ts", ">=", fromDate)
      .where("ts", "<=", toDate)
      .orderBy("ts", "asc")
      .get();

    // yyyy-mm-dd -> aggregation
    const days = new Map();

    // Global rollups
    let grand = 0;
    const models   = new Map();   // model -> USD
    const services = new Map();   // service -> USD
    const kinds    = new Map();   // kind   -> USD

    // Activity counters for dashboard
    const countsTotals = { enhance: 0, t2i: 0, i2i: 0, upscale: 0 };

    for (const doc of snap.docs) {
      const v = doc.data() || {};
      const d = (v.ts?.toDate ? v.ts.toDate() : v.ts) || new Date();
      const key = d.toISOString().slice(0, 10);

      const cost = Number(v.cost_usd || 0);
      const service = String(v.service || "").toLowerCase() || null;   // "gemini" | "enhancor"
      const model   = v.model || null;
      const kindRaw = String(v.kind || "").toLowerCase();

      const kind =
        kindRaw.includes("image")   ? "image"   :
        kindRaw.includes("text")    ? "text"    :
        kindRaw.includes("upscale") ? "upscale" :
        (kindRaw || "other");

      grand += cost;

      const entry = days.get(key) || {
        date: key,
        total: 0,
        services: { gemini: 0, enhancor: 0 },
        models: {},
        counts: { enhance: 0, t2i: 0, i2i: 0, upscale: 0 },
        byKind: { image: 0, text: 0, upscale: 0, other: 0 }
      };

      entry.total += cost;
      if (service) entry.services[service] = (entry.services[service] || 0) + cost;
      if (model)   entry.models[model]     = (entry.models[model]     || 0) + cost;

      // Per-day kind rollup
      entry.byKind[kind] = (entry.byKind[kind] || 0) + cost;

      // Activity counters (normalize action names)
      const a = String(v.action || "").toLowerCase();
      if (a === "enhance" || a === "enhance_prompt" || a === "enhance_description") {
        entry.counts.enhance++; countsTotals.enhance++;
      } else if (a === "t2i") {
        entry.counts.t2i++; countsTotals.t2i++;
      } else if (a === "i2i") {
        entry.counts.i2i++; countsTotals.i2i++;
      } else if (a === "upscale") {
        entry.counts.upscale++; countsTotals.upscale++;
      }

      days.set(key, entry);

      if (model)   models.set(model,   (models.get(model)   || 0) + cost);
      if (service) services.set(service,(services.get(service)|| 0) + cost);
      kinds.set(kind, (kinds.get(kind) || 0) + cost);
    }

    const dayArr = Array.from(days.values()).sort((a,b)=>a.date.localeCompare(b.date));
    const totals = {
      grandTotalUsd: +grand.toFixed(4),
      byService: Object.fromEntries(Array.from(services.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      byModel:   Object.fromEntries(Array.from(models.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      byKind:    Object.fromEntries(Array.from(kinds.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      range: { from: fromDate.toISOString().slice(0,10), to: toDate.toISOString().slice(0,10) }
    };

    // Back-compat for your usage dashboard
    const counts = {
      enhance: countsTotals.enhance,
      t2i: countsTotals.t2i,
      i2i: countsTotals.i2i,
      upscale: countsTotals.upscale,
      images: countsTotals.t2i + countsTotals.i2i,
      prompts: countsTotals.enhance
    };

    return ok(res, { days: dayArr, totals, counts });
  } catch (e) {
    return err(res, e);
  }
}
