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

    const days = new Map(); // yyyy-mm-dd -> { date, total, services, models, counts }
    let grand = 0;

    const models = new Map();   // model -> USD
    const services = new Map(); // service -> USD
    const countsTotals = { enhance: 0, t2i: 0, i2i: 0 };

    for (const doc of snap.docs) {
      const v = doc.data() || {};
      const d = (v.ts?.toDate ? v.ts.toDate() : v.ts) || new Date();
      const key = d.toISOString().slice(0, 10);
      const cost = Number(v.cost_usd || 0);
      grand += cost;

      const entry = days.get(key) || {
        date: key,
        total: 0,
        services: { openai: 0, gemini: 0 },
        models: {},
        counts: { enhance: 0, t2i: 0, i2i: 0 }
      };

      entry.total += cost;
      if (v.service) entry.services[v.service] = (entry.services[v.service] || 0) + cost;
      if (v.model)   entry.models[v.model]     = (entry.models[v.model]     || 0) + cost;

      const a = String(v.action || "").toLowerCase();
      if (a === "enhance") { entry.counts.enhance++; countsTotals.enhance++; }
      else if (a === "t2i") { entry.counts.t2i++; countsTotals.t2i++; }
      else if (a === "i2i") { entry.counts.i2i++; countsTotals.i2i++; }

      days.set(key, entry);

      if (v.model)   models.set(v.model,   (models.get(v.model)   || 0) + cost);
      if (v.service) services.set(v.service,(services.get(v.service)|| 0) + cost);
    }

    const dayArr = Array.from(days.values()).sort((a,b)=>a.date.localeCompare(b.date));
    const totals = {
      grandTotalUsd: +grand.toFixed(4),
      byService: Object.fromEntries(Array.from(services.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      byModel:   Object.fromEntries(Array.from(models.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      range: { from: fromDate.toISOString().slice(0,10), to: toDate.toISOString().slice(0,10) }
    };

    const counts = {
      enhance: countsTotals.enhance,
      t2i: countsTotals.t2i,
      i2i: countsTotals.i2i,
      images: countsTotals.t2i + countsTotals.i2i,
      prompts: countsTotals.enhance
    };

    return ok(res, { days: dayArr, totals, counts });
  } catch (e) {
    return err(res, e);
  }
}
