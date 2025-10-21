// functions/views/archive.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five — Archive</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>", BASE_STYLES, "</style></head>",
  "<body>",
  "<div class='app'>",

    // --- Sidebar (only link text/targets updated; rest unchanged) ---
    "<aside class='sidebar'>",
      "<div class='nav-brand'>",
        "<div class='logo'><img src='/images/app-logo.svg' alt='Sequence Five logo'/></div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a href='/'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Image Generator</span></a>",
        "<a href='/storyboards'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg><span>Storyboards</span></a>",
        "<a class='active' href='/archive' aria-current='page'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Archive</span></a>",
        "<a href='/usage'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3v18h18'/><path d='M7 15l5-5 4 4 5-6'/></svg><span>Usage</span></a>",
        "<span class='sep'></span>",
        "<a href='#'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><polyline points='16 17 21 12 16 7'/></svg><span>Logout</span></a>",
      "</nav>",
    "</aside>",

    // --- Main (your existing archive markup kept as-is) ---
    "<main class='main'>",
      "<div class='wrap'>",
        "<div class='headerbar'>",
          "<div class='hgroup'><h1>Archive</h1><div class='sub'>All your generated images.</div></div>",
        "</div>",
        "<div class='card'>",
          "<div id='grid' class='grid-gal'></div>",
          "<div id='empty' class='hint' style='display:none'>No images yet.</div>",
          "<div id='sentinel' style='height:1px'></div>",
        "</div>",
        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script src='/assets/nbviewer.js'></script>",
  "<script src='/assets/archive.js'></script>",   // <-- renamed asset
  "</body></html>"
].join("");
