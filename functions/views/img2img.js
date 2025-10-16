// functions/views/img2img.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five Generator — Image-To-Image</title><style>",
  BASE_STYLES,
  ".dz{position:relative;border-radius:24px;overflow:hidden;cursor:pointer;",
  "  background:linear-gradient(180deg,#0b0f22,#0a0e1e);",
  "  border:1px dashed #2a3354; min-height:260px; display:flex; align-items:center; justify-content:center;",
  "  transition:border-color .2s ease, box-shadow .2s ease}",
  ".dz:hover{border-color:#3a4680; box-shadow:0 12px 36px rgba(124,58,237,.18)}",
  ".dz input[type=file]{position:absolute; inset:0; opacity:0; cursor:pointer}",
  ".dz-hint{position:absolute; inset:auto 16px 16px 16px; display:flex; align-items:center; justify-content:space-between; gap:10px}",
  ".dz-pill{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;",
  "  background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)); border:1px solid #2f375a; color:#d7dbff; font-weight:700; font-size:12px}",
  ".dz-title{font-weight:800; letter-spacing:.2px}",
  ".dz img{display:block; width:100%; height:auto}",
  ".stack{display:grid; gap:18px; grid-template-columns:1fr}",
  "</style></head>",
  "<body><div class='wrap'>",

  "<header>",
    "<div class='brand'>",
      "<div class='logo-wrap'><img class='logo-img' src='https://www.sequencefive.com/images/sequencefive-logo-navbar.svg' alt='Sequence Five logo'/></div>",
      "<span>Sequence Five Generator</span>",
    "</div>",
    "<nav>",
      "<a href='/'>Text-To-Image</a>",
      "<a class='active' href='/img2img'>Image-To-Image</a>",
      "<a href='/gallery'>Gallery</a>",
      "<a href='/storyboards'>Storyboards</a>",
    "</nav>",
  "</header>",

  "<div class='stack'>",
    "<div class='card'>",
      "<div id='dz' class='dz frame'>",
        "<input id='file' type='file' accept='image/*' />",
        "<div id='dzInner' style='text-align:center;padding:22px'>",
          "<div class='dz-title' style='font-size:16px;margin-bottom:6px'>Upload base image</div>",
          "<div class='hint'>Click to choose or drag & drop</div>",
        "</div>",
        "<div class='dz-hint'><span class='dz-pill'>PNG / JPG</span><span class='dz-pill'>16:9 preferred</span></div>",
      "</div>",

      "<div style='margin-top:14px'>",
        "<input id='prompt' placeholder='Show me …'/>",
      "</div>",

      "<div class='row' style='margin-top:10px'>",
        "<button id='go' class='btn'>Generate</button>",
        "<button id='download' class='pill' disabled>Download</button>",
        "<a id='viewInGallery' class='pill' style='display:none;text-decoration:none' href='/gallery'>View in Gallery ▶</a>",
      "</div>",
    "</div>",

    "<div class='card'>",
      "<div class='row' style='justify-content:space-between'><strong>Result (16:9)</strong></div>",
      "<div id='stage' class='imgwrap' style='margin-top:8px'><span class='hint'>No image yet</span></div>",
    "</div>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",

  "<script src='/assets/img2img.js'></script>",

  "</div></body></html>"
].join("");
