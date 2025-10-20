// functions/app.js
import express from "express";
import rateLimit from "express-rate-limit";

import auth from "./middleware/auth.js";
import pages from "./routes/pages.js";
import api from "./routes/api.js";
import assets from "./routes/assets.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

// Health + favicon early (no auth)
app.get("/healthz", (_req, res) => res.type("text").send("ok"));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Basic protections
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
app.use(limiter);

// Optional basic auth (no-op if not configured)
app.use(auth);

// Routes
app.use(pages);
app.use(api);
app.use(assets);

export default app;
