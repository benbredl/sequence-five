// functions/views/storyboard.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://fonts.googleapis.com'>",
  "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>",
  "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;600&display=swap' rel='stylesheet'>",
  "<title>Sequence Five — Storyboard</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `
  /* ----- Page header tweaks ----- */
  .nav-brand .nav-title{ font-weight:600; } /* keep semi-bold across pages */
  .headerbar .hgroup h1{ font-weight:600; } /* consistent page title weight */

  /* ----- Head card ----- */
  #head .head-title{ font-weight:700; margin-bottom:6px }
  #head .head-desc{ color:var(--muted); font-size:12px; line-height:1.5 }

  /* ----- Timeline rail: continuous line across the whole list ----- */
  .sb-list{
    margin-top:16px;
    position:relative; /* allow the continuous rail */
  }
  .sb-list::before{
    content:"";
    position:absolute;
    top:0; bottom:0;
    left:13px; width:2px;
    background:rgba(79,141,253,.18); /* subtle blue */
    pointer-events:none;
  }

  /* Items align to the left rail; dots per card are centered vertically */
  .sb-item{
    display:grid;
    grid-template-columns:28px 1fr;
    gap:18px;
    margin:28px 0;
  }
  .sb-rail{ position:relative; }
  .sb-dot{
    position:absolute; left:5px; top:50%; transform:translateY(-50%);
    width:16px; height:16px; border-radius:50%;
    background:radial-gradient(circle at 40% 30%, rgba(79,141,253,.9) 0%, rgba(79,141,253,.55) 55%, rgba(79,141,253,.25) 100%);
    box-shadow:0 0 0 6px rgba(79,141,253,.10);
    opacity:.9;
  }

  /* ----- Card layout ----- */
  .sb-card{
    border-radius:22px;
    padding:22px;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1.2px solid var(--line-soft);
    box-shadow:var(--shadow-soft);
  }
  .sb-inner{
    display:grid; grid-template-columns:1.05fr 1fr; gap:22px; align-items:center;
  }
  @media (max-width:1000px){ .sb-inner{ grid-template-columns:1fr; } }

  /* ----- Media smaller + overlay ----- */
  .sb-media{
    position:relative;
    border-radius:18px; overflow:hidden;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1px solid var(--line-soft);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
    aspect-ratio:16/9;
    width:82%;            /* smaller image as requested */
    max-width:700px;      /* safety cap on large screens */
  }
  .sb-media img{ display:block; width:100%; height:100%; object-fit:cover }
  .blur-up{ filter:blur(12px); transform:translateZ(0); transition:filter .45s ease }
  .blur-up.is-loaded{ filter:none }

  /* Bottom overlay (subtle) */
  .sb-ov{
    position:absolute; left:0; right:0; bottom:0;
    padding:8px 12px;
    background:linear-gradient(0deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%);
    display:flex; align-items:center; gap:10px;
    pointer-events:none;
  }
  .sb-pill{
    display:inline-flex; align-items:center; gap:6px; border-radius:999px;
    border:1px solid var(--line-soft);
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    color:#c7ceed; padding:3px 8px; font-size:11px; font-weight:800; letter-spacing:.2px;
  }
  .sb-meta-small{ font-size:12px; color:#e6e9ff; opacity:.92 }

  /* Under-image actions */
  .sb-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:10px }
  .sb-actions .btn-ghost{ box-shadow:none } /* no glow */

  /* Right side: shot text */
  .sb-shot-title{ font-weight:700; margin:0 0 6px 0 }
  .sb-shot-desc{ color:#cbd3f3; font-size:13px; line-height:1.6; margin-bottom:10px }
  `,
  "</style></head>",
  "<body>",
  "<div class='app'>",

    "<aside class='sidebar'>",
      "<div class='nav-brand'>",
        "<div class='logo'><img src='/images/app-logo.svg' alt='Sequence Five logo'/></div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a href='/'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg>",
          "<span>Image Generator</span>",
        "</a>",
        "<a class='active' href='/storyboards'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg>",
          "<span>Storyboards</span>",
        "</a>",
        "<a href='/archive'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg>",
          "<span>Archive</span>",
        "</a>",
        "<a href='/usage'>",
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
          "<div class='hgroup'><h1 id='pageTitle'>Storyboard</h1></div>",
        "</div>",
        "<div class='card' id='head'><div class='hint'>Loading…</div></div>",
        "<div class='sb-list' id='itemsWrap'></div>",
        "<div id='empty' class='hint' style='display:none'>No items yet.</div>",
        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script src='/assets/storyboard.js'></script>",
  "</body></html>"
].join("");
