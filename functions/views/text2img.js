// functions/views/text2img.js
import { BASE_STYLES } from "./baseStyles.js";
import { DEFAULT_SYSTEM_PROMPT } from "../config.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://firebasestorage.googleapis.com' crossorigin>",
  "<title>Sequence Five Generator — Text-To-Image</title><style>", BASE_STYLES, "</style></head>",
  "<body><div class='wrap'>",

  "<header>",
    "<div class='brand'>",
      "<div class='logo-wrap'><img class='logo-img' src='https://www.sequencefive.com/images/sequencefive-logo-navbar.svg' alt='Sequence Five logo'/></div>",
      "<span>Sequence Five Generator</span>",
    "</div>",
    "<nav>",
      "<a class='active' href='/'>Text-To-Image</a>",
      "<a href='/img2img'>Image-To-Image</a>",
      "<a href='/gallery'>Gallery</a>",
      "<a href='/storyboards'>Storyboards</a>",
    "</nav>",
  "</header>",

  "<div class='card frame'>",
    "<label for='prompt'>Your prompt</label>",
    "<textarea id='prompt' placeholder='e.g., bioluminescent forest at dusk, volumetric fog, cinematic backlight...'></textarea>",
    "<div class='row' style='margin-top:12px'>",
      "<button id='generate' class='btn'>Generate</button>",
      "<button id='enhance' class='btn-ghost' style='margin-left:8px'>Enhance prompt</button>",
      "<span class='hint' style='margin-left:auto'>In progress: <strong id='inprog'>0</strong> / max <strong id='limit'>5</strong></span>",
    "</div>",
  "</div>",

  "<div class='card' style='margin-top:22px'>",
    "<div class='row' style='justify-content:space-between'><strong>Results</strong></div>",
    "<div id='resultsGrid' class='grid-gal' style='margin-top:12px'></div>",
    "<div id='empty' class='hint'>No results yet.</div>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",
  "<script>var DEFAULT_SYSTEM_PROMPT=", JSON.stringify(DEFAULT_SYSTEM_PROMPT), ";</script>",
  "<script src='/assets/text2img.js'></script>",

  "</div></body></html>"
].join("");
