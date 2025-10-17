import { Router } from "express";
import { db } from "../firebase.js";

const router = Router();

// GET /api/billing/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/api/billing/summary", async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const fromDate = from ? new Date(from + "T00:00:00.000Z") : new Date(Date.now() - 14 * 864e5);
    const toDate   = to   ? new Date(to   + "T23:59:59.999Z") : new Date();

    const snap = await db.collection("billing_events")
      .where("ts", ">=", fromDate)
      .where("ts", "<=", toDate)
      .orderBy("ts", "asc")
      .get();

    const days = new Map(); // yyyy-mm-dd -> { total, openai, gemini, models: {model: cost} }
    let grand = 0;
    const models = new Map(); // model -> cost
    const services = new Map(); // service -> cost

    for (const doc of snap.docs) {
      const v = doc.data();
      const d = (v.ts?.toDate ? v.ts.toDate() : v.ts) || new Date();
      const key = d.toISOString().slice(0,10);
      const cost = Number(v.cost_usd || 0);
      grand += cost;

      const entry = days.get(key) || { date: key, total: 0, services: { openai: 0, gemini: 0 }, models: {} };
      entry.total += cost;
      if (v.service) entry.services[v.service] = (entry.services[v.service] || 0) + cost;
      if (v.model) entry.models[v.model] = (entry.models[v.model] || 0) + cost;
      days.set(key, entry);

      if (v.model) models.set(v.model, (models.get(v.model) || 0) + cost);
      if (v.service) services.set(v.service, (services.get(v.service) || 0) + cost);
    }

    const dayArr = Array.from(days.values()).sort((a,b)=>a.date.localeCompare(b.date));
    const totals = {
      grandTotalUsd: +grand.toFixed(4),
      byService: Object.fromEntries(Array.from(services.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      byModel: Object.fromEntries(Array.from(models.entries()).map(([k,v])=>[k,+v.toFixed(4)])),
      range: { from: fromDate.toISOString().slice(0,10), to: toDate.toISOString().slice(0,10) }
    };

    res.json({ days: dayArr, totals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

export default router;
