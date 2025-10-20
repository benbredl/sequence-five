// functions/views/dashboard.js
import { BASE_STYLES } from "./baseStyles.js";

const INLINE_LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="#fff" aria-label="Logo" role="img" style="width:22px;height:22px;display:block">
  <path d="M188.42 274.96a3.14 3.14 0 0 0-.23-4.34c-.39-.31-.85-.62-1.4-.7l-67.49-21.95c-2.33-.78-3.65-3.26-2.87-5.66l19.7-60.74c.78-2.33 3.26-3.65 5.66-2.87h0l7.52 2.4-21.95-96.35-17.3-10.39c-53.67 42.58-84.93 107.2-85.08 175.7v.47c0 3.8.08 7.6.31 11.4v.31c.85 16.52 3.57 32.89 8.07 48.79l120.86 11.09 34.21-47.09h0v-.08zM391.51 75.67l-105.03 63.07v58.72c-.16 1.71 1.09 3.18 2.72 3.34.54 0 1.01 0 1.55-.23l67.49-21.95c2.33-.78 4.89.54 5.66 2.87h0l19.7 60.74c.78 2.33-.54 4.89-2.87 5.66l-7.21 2.33 74.08 64.54 18.54-1.71c4.81-16.76 7.68-33.98 8.61-51.35v-.54c.16-3.57.23-7.21.23-10.78v-.47a224.59 224.59 0 0 0-83.39-174.38l-.08.16zM252.65 317.86c-.85-1.47-2.72-1.94-4.19-1.09-.47.23-.85.62-1.09 1.09l-41.73 57.4c-1.47 2.02-4.27 2.48-6.28 1.01h0l-51.66-37.55c-2.02-1.47-2.48-4.27-1.01-6.28h0l4.73-6.59-98.05-9-14.2 12.33c30.8 82.46 108.45 141.96 200.6 146.07l47.16-110.23-34.29-47.16zm60.51-47.94c-1.63.39-2.72 2.02-2.33 3.72.08.47.31.93.7 1.32l41.73 57.4c1.47 2.02 1.01 4.81-1.01 6.28h0l-51.66 37.55c-2.02 1.47-4.81 1.01-6.28-1.01h0l-4.65-6.44-38.55 90.29 6.98 16.29c92.31-3.26 170.51-62.21 202-144.29l-91.07-79.36-55.77 18.15-.08.08zm-103.87-69.28c1.55.7 3.34 0 4.03-1.63.23-.47.31-1.01.23-1.55v-70.98a4.51 4.51 0 0 1 4.5-4.5h63.92a4.51 4.51 0 0 1 4.5 4.5v7.6l84.48-50.73 4.5-19.63c-75.17-50.5-173.38-50.97-249.01-1.16l27.38 120.01 55.54 18h0l-.08.08z"/>
</svg>
`;

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://fonts.googleapis.com'>",
  "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>",
  "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;600&display=swap' rel='stylesheet'>",
  "<title>Sequence Five — Usage</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `
  body{ font-family:'Open Sans', Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial !important; }

  .kpi,.card{
    background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));
    border:1px solid var(--line);
    border-radius:16px;
    box-shadow:var(--shadow-soft);
  }

  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  @media(max-width:980px){.cards{grid-template-columns:1fr}}

  .kpi{padding:16px}
  .kpi .label{font-size:12px;color:var(--muted)}
  .kpi .val{font-size:22px;font-weight:600;margin-top:6px}

  .rowh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}

  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;overflow:hidden}
  @media (max-width: 1100px){ .grid{grid-template-columns:1fr} }

  .chart{height:320px;border-radius:16px;border:1px solid var(--line);padding:12px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));overflow:hidden}
  .chart canvas{display:block;width:100% !important;height:100% !important}

  .table{margin-top:14px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .table table{width:100%;border-collapse:collapse;font-size:13px}
  .table th,.table td{padding:10px;border-bottom:1px solid #232845}
  .table th{text-align:left;color:#c8d0ee;font-weight:600}

  .range-row{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}
  .date-field label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
  .date-field input[type="date"]{
    font-family:'Open Sans',sans-serif;
    background:linear-gradient(180deg,#0b0f22,#0a0e1e);
    color:var(--ink);
    border:1px solid #2b3359;border-radius:12px;padding:10px 12px;height:40px;outline:none;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.03);appearance:none;-webkit-appearance:none;color-scheme:dark;
  }
  .range-row .date-field input[type="date"]::-webkit-calendar-picker-indicator{ filter:invert(1) brightness(1.2) !important; opacity:.95 !important; }

  .range-presets{display:flex;gap:8px;flex-wrap:wrap}
  .range-presets .pill{
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    border:1px solid #2f375a;
    color:#d7dbff; box-shadow:none; font-weight:600; border-radius:12px; padding:8px 12px;
    transition:filter .16s ease, transform .16s ease, border-color .2s ease, background .2s ease;
  }
  .range-presets .pill:hover{ filter:brightness(1.06) }
  .range-presets .pill.active{
    background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
    border-color:#343d66; color:#ffffff;
  }

  .wrap{ width:min(60vw,1200px); margin:28px auto 40px; padding:0 22px }
  @media (max-width: 980px){ .wrap{ width:92vw; padding:0 16px } }
  `,
  "</style></head>",
  "<body>",
  "<div class='app'>",

    "<aside class='sidebar'>",
      "<div class='nav-brand'>",
        "<div class='logo'>", INLINE_LOGO, "</div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a href='/'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg>",
          "<span>Image Generator</span>",
        "</a>",
        "<a href='/storyboards'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg>",
          "<span>Storyboards</span>",
        "</a>",
        "<a href='/gallery'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg>",
          "<span>Archive</span>",
        "</a>",
        "<a class='active' href='/dashboard' aria-current='page'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3v18h18'/><path d='M7 15l5-5 4 4 5-6'/></svg>",
          "<span>Usage</span>",
        "</a>",
        "<span class='sep'></span>",
        "<a href='#'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><polyline points='16 17 21 12 16 7'/></svg>",
          "<span>Logout</span>",
        "</a>",
      "</nav>",
    "</aside>",

    "<main class='main'>",
      "<div class='wrap'>",

        "<div class='headerbar'>",
          "<div class='hgroup'><h1>Usage</h1><div class='sub'>Daily spend and activity by type.</div></div>",
          "<div class='range-row'>",
            "<div class='date-field'><label>From</label><input id='from' type='date'/></div>",
            "<div class='date-field'><label>To</label><input id='to' type='date'/></div>",
            "<button id='apply' class='pill'>Apply</button>",
          "</div>",
        "</div>",

        "<div class='card' style='margin-bottom:12px'>",
          "<div class='rowh'>",
            "<strong>Quick ranges</strong>",
            "<div class='range-presets'>",
              "<button class='pill' data-range='today'>Today</button>",
              "<button class='pill' data-range='last7'>Last 7 days</button>",
              "<button class='pill' data-range='month'>This month</button>",
              "<button class='pill' data-range='year'>This year</button>",
            "</div>",
          "</div>",
        "</div>",

        "<div class='cards'>",
          "<div class='kpi'><div class='label'>Total (EUR)</div><div id='kpiTotal' class='val'>€0.00</div></div>",
          "<div class='kpi'><div class='label'>Text (EUR)</div><div id='kpiText' class='val'>€0.00</div></div>",
          "<div class='kpi'><div class='label'>Image (EUR)</div><div id='kpiImage' class='val'>€0.00</div></div>",
        "</div>",

        "<div class='grid' style='margin-top:14px'>",
          "<div class='card'>",
            "<div class='rowh'><strong>Daily spend</strong><span class='hint'>EUR per day</span></div>",
            "<div id='chartDaily' class='chart'><canvas id='cDaily' aria-label='Daily spend line chart'></canvas></div>",
          "</div>",
          "<div class='card'>",
            "<div class='rowh'><strong>Usage</strong><span class='hint'>Images vs Prompts</span></div>",
            "<div id='chartModels' class='chart'><canvas id='cUsage' aria-label='Usage bar chart'></canvas></div>",
          "</div>",
        "</div>",

        "<div class='card' style='margin-top:14px'>",
          "<div class='rowh'><strong>Day by day</strong></div>",
          "<div id='table' class='table'></div>",
        "</div>",

        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script src='https://cdn.jsdelivr.net/npm/chart.js'></script>",
  "<script src='/assets/dashboard.js'></script>",
  "</body></html>"
].join("");
