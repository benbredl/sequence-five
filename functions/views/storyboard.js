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
  .nav-brand .nav-title{ font-weight:600; }
  .headerbar .hgroup h1{ font-weight:600; }

  /* List container + continuous rail */
  .sb-list{
    margin-top:16px;
    position:relative;
  }
  .sb-list::before{
    content:"";
    position:absolute; top:0; bottom:0; left:13px; width:2px;
    background:rgba(79,141,253,.18);
    pointer-events:none;
  }

  /* Each item has 3 columns: rail | card | buttons */
  .sb-item{
    display:grid;
    grid-template-columns:28px 1fr auto;
    gap:16px;
    margin:18px 0;
    /* keep items stretching to the tallest element (the card);
       we'll center the rail + buttons with align-self */
    align-items:stretch;
  }

  .sb-rail{
    position:relative;
    display:flex;
    align-items:center;           /* center handle vertically inside the rail */
    justify-content:center;
    align-self:stretch;           /* make rail match the card's height */
  }

  /* Drag handle replaces the dot */
  .sb-handle{
    width:18px; height:22px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    cursor:grab; user-select:none;
    color:#d8e0ff; opacity:.9;
    transition: transform .12s ease, background .12s ease, opacity .12s ease;
    background:transparent;
  }
  .sb-handle:active{ cursor:grabbing; transform:scale(0.98); }
  .sb-handle svg{ width:14px; height:14px; display:block; opacity:.95 }

  /* Card layout — smaller image, wider description */
  .sb-card{
    border-radius:22px;
    padding:16px;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1.2px solid var(--line-soft);
    box-shadow:var(--shadow-soft);
  }
  .sb-inner{
    display:grid;
    grid-template-columns:260px 1fr; /* small media like storyboards page */
    gap:16px;
    align-items:start;
  }
  @media (max-width:1000px){ .sb-inner{ grid-template-columns:1fr; } }

  .sb-media{
    position:relative;
    border-radius:14px; overflow:hidden;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1px solid var(--line-soft);
    aspect-ratio:16/9;
    width:100%;
  }
  .sb-media img{ width:100%; height:100%; object-fit:cover; display:block }

  /* Description label + input */
  .sb-desc-label{
    color:var(--muted);
    font-size:12px;
    margin:2px 0 6px 0;
    font-weight:600;
  }
  .sb-desc{
    width:100%;
    background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
    color:var(--ink);
    border:1px solid var(--line-soft);
    border-radius:14px;
    padding:12px 14px;
    font-size:14px;
    outline:none;
    min-height:64px;
    resize:vertical;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
    transition:box-shadow .2s,border-color .2s;
  }
  .sb-desc:focus{
    border-color:var(--line);
    box-shadow:0 0 0 3px rgba(79,141,253,.22);
  }
  .sb-saved{
    font-size:11px; color:#9fc29f; margin-top:6px; opacity:.0; transition:opacity .2s ease;
    display:flex; align-items:center; gap:6px;
  }
  .sb-saved.show{ opacity:1; }
  .sb-saved svg{ width:14px; height:14px; display:block }

  /* Buttons column (to the right of card) */
  .sb-buttons{
    display:flex; flex-direction:column; gap:8px;
    align-items:stretch;
    justify-content:center;       /* center buttons vertically in the row */
    align-self:center;            /* vertically center this column vs the card */
    margin-top:0;                 /* was pushing buttons upward */
  }
  .btn-small{
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    border:1px solid var(--line-soft);
    color:#d7dbff;
    border-radius:10px;
    padding:8px 10px;
    font-weight:600;
    font-size:12px;
    cursor:pointer;
  }
  .btn-small:disabled{ opacity:.6; cursor:not-allowed }

  /* Drag & drop visuals */
  .dragging{ opacity:.65; transform:scale(.998); }
  .drop-placeholder{
    border:2px dashed rgba(79,141,253,.45);
    border-radius:14px;
    height:72px; /* compact placeholder */
    margin:10px 0;
  }
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
        "<div class='sb-list' id='itemsWrap' aria-live='polite'></div>",
        "<div id='empty' class='hint' style='display:none'>No items yet.</div>",
        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script src='/assets/storyboard.js'></script>",
  "</body></html>"
].join("");
