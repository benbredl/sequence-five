// functions/app.js
import express from "express";
import rateLimit from "express-rate-limit";
import pages from "./routes/pages.js";
import api from "./routes/api.js";
import auth from "./middleware/auth.js";
import apiStoryboards from "./routes/api.storyboards.js";
import assets from "./routes/assets.js";
import apiBilling from "./routes/api.billing.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

// health first (no auth)
app.get("/healthz", (_req, res) => res.type("text").send("ok"));

// quiet the favicon 404s
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// protections
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
app.use(limiter);
app.use(auth);

// pages, apis, static assets
app.use(pages);
app.use(api);
app.use(apiStoryboards);
app.use(assets);
app.use(apiBilling);

export default app;
