// functions/views/text2img.js
import { BASE_STYLES } from "./baseStyles.js";
import { DEFAULT_SYSTEM_PROMPT } from "../config.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
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

  "<div class='grid'>",
    "<div class='card frame'>",
      "<label for='prompt'>Your prompt</label>",
      "<textarea id='prompt' placeholder='e.g., bioluminescent forest at dusk, volumetric fog, cinematic backlight...'></textarea>",
      "<div class='row' style='margin-top:12px'><button id='generate' class='btn'>Generate Image</button></div>",
      "<details style='margin-top:12px'><summary>Prompt Enhancer (system)</summary>",
        "<label for='system'>System prompt</label>",
        "<textarea id='system'></textarea>",
        "<div class='hint'>We enhance your prompt first, then render a 16:9 image.</div>",
      "</details>",
    "</div>",

    "<div class='card'>",
      "<label>Enhanced prompt</label>",
      "<div id='enhanced' class='out' style='min-height:120px'>—</div>",
      "<div class='footer'>Model: <span id='modelUsed'>gpt-5-mini</span></div>",
    "</div>",
  "</div>",

  "<div class='card' style='margin-top:22px'>",
    "<div class='row' style='justify-content:space-between'><strong>Result (16:9)</strong>",
      "<div class='row'><button id='download' class='pill' disabled>Download</button>",
      "<a id='viewInGallery' class='pill' style='display:none;text-decoration:none' href='/gallery'>View in Gallery ▶</a></div>",
    "</div>",
    "<div id='stage' class='imgwrap'><span class='hint'>No image yet</span></div>",
  "</div>",

  "<footer class='site-footer'>Made by Sequence Five</footer>",

  "<script>",
  "var DEFAULT_SYSTEM_PROMPT=", JSON.stringify(DEFAULT_SYSTEM_PROMPT), ";",
  "function g(i){return document.getElementById(i)};",
  "g('system').value=DEFAULT_SYSTEM_PROMPT;",

  "g('download').addEventListener('click',function(){var img=document.querySelector('#stage img');if(!img)return;var a=document.createElement('a');a.href=img.src;a.download='image.png';a.click()});",

  "g('generate').addEventListener('click',async function(){",
  "  var prompt=g('prompt').value.trim(); var systemPrompt=(g('system')&&g('system').value)||'';",
  "  if(!prompt){alert('Please enter a prompt.');return;}",
  "  var btn=this; btn.disabled=true; btn.innerHTML='<span class=\"spinner\"></span> Enhancing...';",
  "  g('modelUsed').textContent='gpt-5-mini (enhancing...)'; g('enhanced').textContent='—';",
  "  g('stage').innerHTML='<div class=\"hint\">Waiting for image...</div>';",
  "  try{",
  "    var eRes=await fetch('/api/enhance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt,systemPrompt:systemPrompt})});",
  "    var eJson=await eRes.json(); if(!eRes.ok) throw new Error(eJson.error||'Enhance failed');",
  "    var enhanced=eJson.enhancedPrompt||''; g('modelUsed').textContent=eJson.openaiModelUsed||'gpt-5-mini'; g('enhanced').textContent=enhanced||'(no enhancement)';",
  "    btn.innerHTML='<span class=\"spinner\"></span> Generating image...';",
  "    var genRes=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt,enhancedPrompt:enhanced})});",
  "    var genJson=await genRes.json(); if(!genRes.ok) throw new Error(genJson.error||'Generate failed');",
  "    if(genJson.imageBase64&&genJson.mimeType){var url='data:'+genJson.mimeType+';base64,'+genJson.imageBase64; g('stage').innerHTML='<img class=\"frame\" alt=\"Generated\" src=\"'+url+'\" />'; g('download').disabled=false;}else{g('stage').innerHTML='<div class=\"hint\">No image returned.</div>'; g('download').disabled=true;}",
  "    if(genJson.galleryUrl){var link=g('viewInGallery');link.style.display='inline-block';link.href='/gallery'}",
  "  }catch(err){ console.error(err); g('stage').innerHTML='<div class=\"hint\">Error: '+(err.message||err)+'</div>'; g('download').disabled=true; }",
  "  finally{ btn.disabled=false; btn.textContent='Generate Image'; }",
  "});",
  "</script>",

  "</div></body></html>"
].join("");
