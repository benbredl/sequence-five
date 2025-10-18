// functions/views/dashboard.js
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
  "<title>Sequence Five — Usage</title><style>",
  BASE_STYLES,
  ".cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media(max-width:980px){.cards{grid-template-columns:1fr}}",
  ".kpi{padding:16px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));box-shadow:0 10px 30px rgba(2,6,23,.36), inset 0 1px 0 rgba(255,255,255,.03)}",
  ".kpi .label{font-size:12px;color:var(--muted)} .kpi .val{font-size:22px;font-weight:900;margin-top:6px}",
  ".rowh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
  ".controls{display:flex;gap:8px;align-items:center}",
  ".chart{height:260px;border-radius:16px;border:1px solid var(--line);padding:12px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))}",
  ".chart svg{width:100%;height:100%}",
  ".table{margin-top:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden}",
  ".table table{width:100%;border-collapse:collapse;font-size:13px}",
  ".table th,.table td{padding:10px;border-bottom:1px solid #232845} .table th{text-align:left;color:#c8d0ee;font-weight:700}",
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
        `<a href='/storyboards'>${navIcon(ICONS.boards)}<span>Storyboards</span></a>`,
        `<a href='/gallery'>${navIcon(ICONS.archive)}<span>Archive</span></a>`,
        `<a class='active' href='/dashboard'>${navIcon(ICONS.usage)}<span>Usage</span></a>`,
        `<a class='section' href='/logout'>${navIcon(ICONS.logout)}<span>Logout</span></a>`,
      "</nav>",
    "</aside>",

    "<main class='main'>",
      "<div class='page-head'><h2 style='margin:0'>Usage</h2>",
      "<div class='controls'><label>From</label><input id='from' type='date'/><label>To</label><input id='to' type='date'/><button id='apply' class='btn-neo'>Apply</button></div></div>",

      "<div class='cards' style='margin-top:12px'>",
        "<div class='kpi'><div class='label'>Total (USD)</div><div id='kpiTotal' class='val'>$0.00</div></div>",
        "<div class='kpi'><div class='label'>OpenAI (USD)</div><div id='kpiOpenAI' class='val'>$0.00</div></div>",
        "<div class='kpi'><div class='label'>Gemini (USD)</div><div id='kpiGemini' class='val'>$0.00</div></div>",
      "</div>",

      "<div class='grid' style='margin-top:14px'>",
        "<div class='card'>",
          "<div class='rowh'><strong>Daily spend</strong><span class='hint'>USD per day</span></div>",
          "<div id='chartDaily' class='chart'></div>",
        "</div>",
        "<div class='card'>",
          "<div class='rowh'><strong>By model</strong><span class='hint'>USD by model</span></div>",
          "<div id='chartModels' class='chart'></div>",
        "</div>",
      "</div>",

      "<div class='card' style='margin-top:14px'>",
        "<div class='rowh'><strong>Day by day</strong><button id='refresh' class='pill'>Refresh</button></div>",
        "<div id='table' class='table'></div>",
      "</div>",
    "</main>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",
  "<script src='/assets/dashboard.js'></script>",
  "</div></body></html>"
].join("");
