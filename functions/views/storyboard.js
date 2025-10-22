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
  :root{ --accent-blue:#4F8DFD; }

  .nav-brand .nav-title{ font-weight:600; }
  .headerbar .hgroup h1{ font-weight:600; }

  /* List container + continuous rail */
  .sb-list{
    margin-top:16px;
    position:relative;
  }
  .sb-list::before{
    content:"";
    position:absolute; top:0; bottom:0; left:13px;
    width:1.2px;                               /* same width feel as card border */
    background:var(--line-soft);               /* same color as card border */
    pointer-events:none;
  }

  /* Each item has 3 columns: rail | card | buttons */
  .sb-item{
    display:grid;
    grid-template-columns:28px 1fr auto;
    gap:16px;
    margin:18px 0;
    align-items:stretch;
  }

  .sb-rail{
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
    align-self:stretch;
  }

  /* Bigger, friendlier drag handle */
  .sb-handle{
    width:22px; height:26px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    cursor:grab; user-select:none;
    color:#d8e0ff; opacity:.9;
    transition: transform .12s ease, background .12s ease, opacity .12s ease;
    background:transparent;
  }
  .sb-handle:active{ cursor:grabbing; transform:scale(0.985); }
  .sb-handle svg{ width:18px; height:18px; display:block; opacity:.95 }

  /* Card layout */
  .sb-card{
    border-radius:22px;
    padding:16px;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1.2px solid var(--line-soft);
    box-shadow:var(--shadow-soft);
  }
  .sb-inner{
    display:grid;
    grid-template-columns:260px 1fr;
    gap:16px;
    align-items:stretch;
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

  .sb-right{ display:flex; flex-direction:column; min-height:0; }

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
    transition:border-color .25s ease, box-shadow .2s, background .2s;
    flex:1;
    min-height:120px;
  }
  .sb-desc::placeholder{ opacity:.55; }

  /* Focus: keep it white (no blue second border) */
  .sb-desc:focus{
    border-color:rgba(255,255,255,.60);
    box-shadow:none;
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.035));
  }

  .sb-saved{
    font-size:11px; color:#9fc29f; margin-top:6px; opacity:.0; transition:opacity .2s ease;
    display:flex; align-items:center; gap:6px;
  }
  .sb-saved.show{ opacity:1; }
  .sb-saved svg{ width:14px; height:14px; display:block }

  .sb-buttons{
    display:flex; flex-direction:column; gap:8px;
    align-items:stretch;
    justify-content:center;
    align-self:center;
    margin-top:0;
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

  .dragging{ opacity:.65; transform:scale(.998); }
  .drop-placeholder{
    border:2px dashed rgba(79,141,253,.45);
    border-radius:14px;
    height:72px;
    margin:10px 0;
  }

  /* Subtle blue cues */
  @keyframes sb-borderColorPulseDesc {
    0%   { border-color: var(--line-soft); }
    18%  { border-color: rgba(79,141,253,.85); }
    100% { border-color: var(--line-soft); }
  }
  .sb-desc.saving,
  .sb-desc.saving:focus{
    animation: sb-borderColorPulseDesc 1.2s ease-out infinite;
    border-color: rgba(79,141,253,.85);
    box-shadow:none;
  }

  @keyframes sb-borderPulseCard {
    0%   { box-shadow: inset 0 0 0 0 rgba(79,141,253,0); }
    12%  { box-shadow: inset 0 0 0 1.6px rgba(79,141,253,.55); }
    100% { box-shadow: inset 0 0 0 0 rgba(79,141,253,0); }
  }
  .sb-card.reordered{ animation: sb-borderPulseCard 1s ease-out 1; }

  @media (prefers-reduced-motion: reduce) {
    .sb-desc.saving,
    .sb-card.reordered{ animation: none; }
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
