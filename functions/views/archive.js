// functions/views/archive.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five — Archive</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `
  /* Small tweaks for the header actions */
  .header-actions{display:flex;align-items:center;gap:10px}
  .btn-upload{
    display:inline-flex;align-items:center;gap:8px;
    padding:8px 12px;border-radius:10px;font-weight:600;
    background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
    border:1px solid var(--line);
    color:#e9edff; cursor:pointer;
    box-shadow:var(--shadow-soft);
  }
  .btn-upload:hover{
    background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
    border-color:#343d66;
  }
  .btn-upload svg{width:16px;height:16px;display:block}
  .visually-hidden{
    position:absolute !important; width:1px; height:1px; padding:0; margin:-1px;
    overflow:hidden; clip:rect(0, 0, 1px, 1px); white-space:nowrap; border:0;
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
        "<a href='/'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Image Generator</span></a>",
        "<a href='/storyboards'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg><span>Storyboards</span></a>",
        "<a class='active' href='/archive' aria-current='page'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Archive</span></a>",
        "<a href='/usage'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3v18h18'/><path d='M7 15l5-5 4 4 5-6'/></svg><span>Usage</span></a>",
        "<span class='sep'></span>",
        "<a href='#'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><polyline points='16 17 21 12 16 7'/></svg><span>Logout</span></a>",
      "</nav>",
    "</aside>",

    "<main class='main'>",
      "<div class='wrap'>",
        "<div class='headerbar'>",
          "<div class='hgroup'><h1>Archive</h1><div class='sub'>All your generated images.</div></div>",
          "<div class='header-actions'>",
            "<button id='btnUpload' class='btn-upload' type='button' aria-label='Upload image'>",
              "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>",
                "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/>",
                "<polyline points='17 8 12 3 7 8'/>",
                "<line x1='12' y1='3' x2='12' y2='15'/>",
              "</svg>",
              "<span>Upload image</span>",
            "</button>",
            "<input id='inputUpload' class='visually-hidden' type='file' accept='image/*' />",
          "</div>",
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
  "<script src='/assets/archive.js'></script>",
  "</body></html>"
].join("");
