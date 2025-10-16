// functions/views/gallery.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five Generator — Gallery</title><style>",
  BASE_STYLES,
  ".blur-up{filter:blur(12px);transform:translateZ(0);transition:filter .4s ease}.blur-up.is-loaded{filter:none}",
  "</style></head>",
  "<body><div class='wrap'>",

  "<header>",
    "<div class='brand'>",
      "<div class='logo-wrap'><img class='logo-img' src='https://www.sequencefive.com/images/sequencefive-logo-navbar.svg' alt='Sequence Five logo'/></div>",
      "<span>Sequence Five Generator</span>",
    "</div>",
    "<nav>",
      "<a href='/'>Text-To-Image</a>",
      "<a href='/img2img'>Image-To-Image</a>",
      "<a class='active' href='/gallery'>Gallery</a>",
      "<a href='/storyboards'>Storyboards</a>",
    "</nav>",
  "</header>",

  "<div class='card'>",
    "<div class='row' style='justify-content:space-between;align-items:center'>",
    "<strong>Latest images</strong><button id='refresh' class='pill'>Refresh</button>",
    "</div>",
    "<div id='grid' class='grid-gal' style='margin-top:12px'></div>",
    "<div id='empty' class='hint' style='display:none'>No images yet.</div>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",

  "<script src='/assets/gallery.js'></script>",
  "</div></body></html>"
].join("");
