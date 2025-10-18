// functions/views/storyboard.js
import { BASE_STYLES } from "./baseStyles.js";

function navIcon(pathD){
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${pathD}"/></svg>`;
}
const ICONS = {
  generator:  "M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2z",
  boards:     "M3 7h18M3 12h18M3 17h18",
  archive:    "M3 4h18v4H3V4zm0 6h8v10H3V10zm10 0h8v10h-8V10z",
  usage:      "M4 19V9m6 10V5m6 14V13m4 6V3",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
};

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five — Storyboard</title><style>",
  BASE_STYLES,
  ".sb-list{margin-top:16px}",
  ".sb-item{display:grid;grid-template-columns:28px 1fr;gap:18px;margin:28px 0}",
  ".sb-rail{position:relative}",
  ".sb-rail::after{content:'';position:absolute;top:-8px;bottom:-28px;left:13px;width:2px;background:rgba(139,92,246,.28)}",
  ".sb-item:last-child .sb-rail::after{bottom:0}",
  ".sb-dot{position:relative;left:4px;top:2px;width:20px;height:20px;border-radius:50%",
  "  ;background:linear-gradient(180deg,#8b5cf6,#7c3aed)",
  "  ;box-shadow:0 0 0 5px rgba(139,92,246,.18), 0 10px 24px rgba(2,6,23,.55)}",
  ".sb-card{border-radius:34px;padding:28px",
  "  ;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.03))",
  "  ;border:1.2px solid #3a3561",
  "  ;box-shadow:0 26px 70px rgba(124,58,237,.20), inset 0 1px 0 rgba(255,255,255,.04)}",
  ".sb-inner{display:grid;grid-template-columns:1.05fr 1fr;gap:22px;align-items:center}",
  "@media (max-width:1000px){.sb-inner{grid-template-columns:1fr;}}",
  ".sb-title{margin:0 0 10px 0;font-size:28px;font-weight:900;letter-spacing:.2px",
  "  ;background:linear-gradient(90deg,#ffffff 0%,#d6a8ff 48%,#93c5fd 100%)",
  "  ;-webkit-background-clip:text;background-clip:text;color:transparent}",
  ".sb-desc{color:#cfd6f3;opacity:.95;line-height:1.5;margin:4px 0 14px 0;font-size:15px}",
  ".btn-neo{position:relative;display:inline-flex;align-items:center;justify-content:center;height:46px;padding:0 22px;border-radius:999px;font-weight:800;font-size:14px;color:#eef2ff;border:1.5px solid transparent;cursor:pointer;background:linear-gradient(#0b0f22,#0b0f22) padding-box,linear-gradient(90deg,#a78bfa 0%,#22d3ee 100%) border-box;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}",
  ".btn-neo:hover{filter:brightness(1.06);box-shadow:0 8px 26px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.12)}",
  ".btn-neo:active{transform:translateY(1px)}",
  ".sb-media{border-radius:26px;overflow:hidden;background:#0b0f22;border:1px solid #2d3560;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}",
  ".sb-media img{display:block;width:100%;height:auto}",
  ".blur-up{filter:blur(12px);transform:translateZ(0);transition:filter .45s ease}.blur-up.is-loaded{filter:none}",
  ".sb-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}",
  "</style></head>",
  "<body><div class='wrap'>",

  "<div class='app-shell'>",
    "<aside class='sidebar'>",
      "<div class='brand'>",
        "<div class='logo-wrap'><img class='logo-img' src='https://www.sequencefive.com/images/sequencefive-logo-navbar.svg' alt='Sequence Five logo'/></div>",
        "<span>Sequence Five</span>",
      "</div>",
      "<nav class='side-nav'>",
        `<a href='/image-generator'>${navIcon(ICONS.generator)}<span>Image Generator</span></a>`,
        `<a class='active' href='/storyboards'>${navIcon(ICONS.boards)}<span>Storyboards</span></a>`,
        `<a href='/gallery'>${navIcon(ICONS.archive)}<span>Archive</span></a>`,
        `<a href='/dashboard'>${navIcon(ICONS.usage)}<span>Usage</span></a>`,
        `<a class='section' href='/logout'>${navIcon(ICONS.logout)}<span>Logout</span></a>`,
      "</nav>",
    "</aside>",

    "<main class='main'>",
      "<div class='page-head'><h2 style='margin:0'>Storyboard</h2></div>",
      "<div class='card' id='head'><div class='hint'>Loading…</div></div>",
      "<div class='sb-list' id='itemsWrap'></div>",
      "<div id='empty' class='hint' style='display:none'>No items yet.</div>",
    "</main>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",

  "<script src='/assets/storyboard.js'></script>",
  "</div></body></html>"
].join("");
