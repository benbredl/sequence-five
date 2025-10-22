// functions/views/image-generator.js
import { BASE_STYLES } from "./baseStyles.js";
import { DEFAULT_SYSTEM_PROMPT } from "../config.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://firebasestorage.googleapis.com' crossorigin>",
  "<title>Sequence Five — Image Generator</title>",
  "<style>", BASE_STYLES, `
/* --- Generator-page-only tweaks --- */

/* Force exactly 2 columns for the Results grid (independent of archive grid). */
#resultsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* Make card tiles visually consistent with archive tiles if not already. */
#resultsGrid .card-gal {
  position: relative;
}

/* Progressive blur-up: start blurred, un-blur once .is-loaded is added (from JS). */
img.blur-up {
  filter: blur(14px);
  transform: scale(1.02);
  transition: filter .35s ease, transform .35s ease, opacity .35s ease;
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
img.blur-up.is-loaded {
  filter: blur(0);
  transform: none;
}

/* Make the “Show all images” button match Usage buttons nicely */
a#showAll.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: var(--glass1);
  text-decoration: none;
  font-weight: 500;
  opacity: .88;
}
a#showAll.pill:hover { opacity: 1; }

/* Prompt font-size override (12px as requested) */
#prompt { font-size: 12px; }
  `, "</style></head>",
  "<body>",
  "<div class='app'>",

    "<aside class='sidebar'>",
      "<div class='nav-brand'>",
        "<div class='logo'><img src='/images/app-logo.svg' alt='Sequence Five logo'/></div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a class='active' href='/' aria-current='page'>",
          "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg>",
          "<span>Image Generator</span>",
        "</a>",
        "<a href='/storyboards'>",
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
          "<div class='hgroup'>",
            "<h1 style='font-weight:600'>Image Generator</h1>",
            "<div class='sub'>Text-to-image or image-to-image — unified clean flow.</div>",
          "</div>",
          "<div class='row'>",
            "<span class='pill'>In progress: <strong id='inprog'>0</strong> / max <strong id='limit'>5</strong></span>",
          "</div>",
        "</div>",

        "<div class='grid'>",
          "<div class='card' style='align-self:start'>",
            "<div id='drop' class='drop frame' tabindex='0' role='button' aria-label='Upload base image'>",
              "<input id='file' type='file' accept='image/*' style='display:none'/>",
              "<div id='dropInner' class='drop-inner'>Upload base image (optional)</div>",
            "</div>",
            "<div style='display:flex;justify-content:space-between;align-items:center;margin-top:10px'>",
              "<div id='uploadMeta' class='hint'></div>",
              "<button id='removeUpload' class='pill' style='display:none'>Remove</button>",
            "</div>",

            "<div style='margin-top:14px'>",
              "<label for='prompt'>Your prompt</label>",
              "<textarea id='prompt' placeholder='Describe the scene…'></textarea>",
            "</div>",
            "<div class='row' style='margin-top:12px'>",
              "<button id='generate' class='btn'>Generate</button>",
              "<button id='enhance' class='btn-ghost' style='margin-left:8px'>Enhance text</button>",
            "</div>",
          "</div>",

          "<div class='card'>",
            "<div class='row' style='justify-content:space-between'><strong>Results</strong></div>",
            "<div id='resultsGrid' class='grid-gal' style='margin-top:12px'></div>",
            "<div id='empty' class='hint' style='font-size:12px'>No results yet.</div>",
            "<div style='margin-top:12px;display:flex;justify-content:center'>",
              "<a id='showAll' class='pill' href='/archive'>Show all images</a>",
            "</div>",
          "</div>",
        "</div>",

        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script>var DEFAULT_SYSTEM_PROMPT=", JSON.stringify(DEFAULT_SYSTEM_PROMPT), ";</script>",
  "<script src='/assets/nbviewer.js'></script>",
  "<script src='/assets/image-generator.js'></script>",
  "</body></html>"
].join("");
