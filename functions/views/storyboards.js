// functions/views/storyboards.js
import { BASE_STYLES } from "./baseStyles.js";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://fonts.googleapis.com'>",
  "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>",
  "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;600&display=swap' rel='stylesheet'>",
  "<title>Sequence Five — Storyboards</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `
  /* Creator card initially hidden */
  #creator{ display:none }

  /* List */
  .sb-list{ margin-top:12px; display:grid; grid-template-columns:1fr; gap:12px }

  /* Board card */
  .sb-card{
    display:grid; grid-template-columns:240px 1fr; gap:16px; align-items:center;
    border:1px solid var(--line-soft); border-radius:16px; padding:12px;
    background:linear-gradient(180deg, var(--glass1), var(--glass2)); box-shadow:var(--shadow-soft)
  }
  @media (max-width:900px){ .sb-card{ grid-template-columns:1fr } }

  /* Thumbnail */
  .sb-thumb{
    position:relative; border-radius:14px; overflow:hidden; border:1px solid var(--line-soft);
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04)
  }
  .sb-thumb::before{ content:""; display:block; aspect-ratio:16/9 }
  .sb-thumb img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block }

  /* Meta */
  .sb-meta-title{ font-weight:700 }
  .sb-meta-desc{ color:var(--muted); margin-top:6px; font-size:13px }
  .sb-meta-foot{ color:#aab3d1; margin-top:10px; font-size:12px; display:flex; gap:10px; align-items:center; justify-content:space-between }

  /* Header button */
  .btn-row{ display:flex; justify-content:flex-end; margin-bottom:10px }
  .btn-plain{
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    border:1px solid var(--line-soft); color:#d7dbff; font-weight:600; font-size:13px;
    border-radius:12px; padding:10px 14px; cursor:pointer
  }

  /* Open link */
  .card-action{
    display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:999px;
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    border:1px solid var(--line-soft); color:#c7ceed; font-size:12px; font-weight:700; text-decoration:none
  }

  .blur-up{ filter:blur(12px); transform:translateZ(0); transition:filter .45s ease }
  .blur-up.is-loaded{ filter:none }
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
        "<a class='active' href='/storyboards' aria-current='page'>",
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
          "<div class='hgroup'><h1>Storyboards</h1><div class='sub'>Create and organize scenes.</div></div>",
          "<div class='btn-row'><button id='showCreator' class='btn-plain'>Create new storyboard</button></div>",
        "</div>",

        "<div class='card' id='creator'>",
          "<h3 style='margin:0 0 10px 0'>Create a Storyboard</h3>",
          "<label>Title</label><input id='title' placeholder='e.g., Launch Teaser — Scene 03'/>",
          "<label style='margin-top:8px'>Short description</label><textarea id='desc' placeholder='What is this storyboard for?'></textarea>",
          "<div class='row' style='margin-top:12px'><button id='create' class='btn'>Create</button></div>",
        "</div>",

        "<div class='card' style='margin-top:20px'>",
          "<strong>Your Storyboards</strong>",
          "<div id='list' class='sb-list'></div>",
          "<div id='empty' class='hint' style='display:none'>No storyboards yet.</div>",
        "</div>",

        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",

  "<script src='/assets/storyboards.js'></script>",
  "</body></html>"
].join("");
