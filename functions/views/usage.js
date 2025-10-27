// functions/views/usage.js
import { BASE_STYLES } from "./baseStyles.js";
// Inject Firebase client config from env
const API_KEY = process.env.FIREBASE_WEB_API_KEY || "";
const AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || "";
const PROJECT_ID =
  (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : "") ||
  process.env.GCLOUD_PROJECT ||
  "";

const INLINE_LOGO = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" fill="#fff" aria-label="Logo" role="img" style="width:22px;height:22px;display:block">
  <path d="M188.42 274.96a3.14 3.14 0 0 0-.23-4.34c-.39-.31-.85-.62-1.4-.7l-67.49-21.95c-2.33-.78-3.65-3.26-2.87-5.66l19.7-60.74c.78-2.33 3.26-3.65 5.66-2.87h0l7.52 2.4-21.95-96.35-17.3-10.39c-53.67 42.58-84.93 107.2-85.08 175.7v.47c0 3.8.08 7.6.31 11.4v.31c.85 16.52 3.57 32.89 8.07 48.79l120.86 11.09 34.21-47.09h0v-.08zM391.51 75.67l-105.03 63.07v58.72c-.16 1.71 1.09 3.18 2.72 3.34.54 0 1.01 0 1.55-.23l67.49-21.95c2.33-.78 4.89.54 5.66 2.87h0l19.7 60.74c.78 2.33-.54 4.89-2.87 5.66l-7.21 2.33 74.08 64.54 18.54-1.71c4.81-16.76 7.68-33.98 8.61-51.35v-.54c.16-3.57.23-7.21.23-10.78v-.47a224.59 224.59 0 0 0-83.39-174.38l-.08.16zM252.65 317.86c-.85-1.47-2.72-1.94-4.19-1.09-.47.23-.85.62-1.09 1.09l-41.73 57.4c-1.47 2.02-4.27 2.48-6.28 1.01h0l-51.66-37.55c-2.02-1.47-2.48-4.27-1.01-6.28h0l4.73-6.59-98.05-9-14.2 12.33c30.8 82.46 108.45 141.96 200.6 146.07l47.16-110.23-34.29-47.16zm60.51-47.94c-1.63.39-2.72 2.02-2.33 3.72.08.47.31.93.7 1.32l41.73 57.4c1.47 2.02 1.01 4.81-1.01 6.28h0l-51.66 37.55c-2.02 1.47-4.81 1.01-6.28-1.01h0l-4.65-6.44-38.55 90.29 6.98 16.29c92.31-3.26 170.51-62.21 202-144.29l-91.07-79.36-55.77 18.15-.08.08zm-103.87-69.28c1.55.7 3.34 0 4.03-1.63.23-.47.31-1.01.23-1.55v-70.98a4.51 4.51 0 0 1 4.5-4.5h63.92a4.51 4.51 0 0 1 4.5 4.5v7.6l84.48-50.73 4.5-19.63c-75.17-50.5-173.38-50.97-249.01-1.16l27.38 120.01 55.54 18h0l-.08.08z"/>
</svg>
`;

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five — Usage</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `

  .kpi,.card{
    background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));
    border:1px solid var(--line);
    border-radius:16px;
    box-shadow:var(--shadow-soft);
  }

  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  @media(max-width:1180px){.cards{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:700px){.cards{grid-template-columns:1fr}}

  .kpi{padding:16px}
  .kpi .label{font-size:12px;color:var(--muted)}
  .kpi .val{font-size:22px;font-weight:600;margin-top:6px}

  .rowh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .subhint{font-size:11px;color:#a1a8be}

  .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;overflow:hidden}
  @media (max-width: 1100px){ .grid{grid-template-columns:1fr} }

  /* Remove inner borders/backgrounds to avoid double borders with .card */
  .chart{height:340px;border-radius:16px;border:none;padding:14px 10px 4px;background:transparent;overflow:hidden}
  .chart canvas{display:block;width:100% !important;height:100% !important}

  .table{margin-top:14px;border:none;border-radius:12px;overflow:hidden;background:transparent}
  .table table{width:100%;border-collapse:collapse;font-size:13px}
  .table th,.table td{padding:10px;border-bottom:1px solid #232845}
  .table th{text-align:left;color:#c8d0ee;font-weight:600}

  .range-row{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap}
  .date-field label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}

  /* Date input + minimal icon wrapper */
  .date-wrap{ position:relative; display:inline-flex; align-items:center; }
  .date-wrap input[type="date"]{
    font-family:'Open Sans',sans-serif;
    background:transparent;
    color:var(--ink);
    border:1px solid var(--line);
    border-radius:12px;
    padding:8px 30px 8px 10px; /* room for the tiny arrow button */
    height:38px;
    outline:none;
    box-shadow:none;
    appearance:auto;
    -webkit-appearance:none;
    color-scheme:dark;
  }
  /* Hide native indicator */
  .date-wrap input[type="date"]::-webkit-calendar-picker-indicator{ display:none; }
  .date-wrap input[type="date"]::-webkit-inner-spin-button{ display:none; }
  .date-wrap input[type="date"]::-webkit-datetime-edit,
  .date-wrap input[type="date"]::-webkit-datetime-edit-fields-wrapper{ padding:0;margin:0; }

  /* Minimal trigger button: no border, no bg, tiny white arrow */
  .date-btn{
    position:absolute; right:6px; top:50%; transform:translateY(-50%);
    width:20px; height:20px;
    border:none; background:transparent; padding:0; margin:0;
    color:#fff; display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer;
  }
  .date-btn svg{ width:12px; height:12px; display:block; }
  .date-btn:focus{ outline:none }

  /* Quick range buttons — remove any blue glow/hover effects */
  .range-presets{display:flex;gap:8px;flex-wrap:wrap}
  .range-presets .pill{
    background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
    border:1px solid #2f375a;
    color:#d7dbff;
    border-radius:12px;
    padding:8px 12px;
    font-weight:600;
    box-shadow:none !important;
    outline:none !important;
    filter:none !important;
    transition:none;
  }
  .range-presets .pill:hover,
  .range-presets .pill:focus,
  .range-presets .pill:active{
    box-shadow:none !important;
    filter:none !important;
    outline:none !important;
    background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
    border-color:#343d66;
    color:#ffffff;
  }

  .wrap{ width:min(60vw,1200px); margin:28px auto 40px; padding:0 22px }
  @media (max-width: 980px){ .wrap{ width:92vw; padding:0 16px } }
  /* Account badge */
  .account{margin:10px 6px 0;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--line-soft);background:linear-gradient(180deg, var(--glass1), var(--glass2));box-shadow:var(--shadow-soft)}
  .acct-photo{width:34px;height:34px;border-radius:10px;overflow:hidden;border:1px solid var(--line-soft);background:rgba(255,255,255,.06);flex:0 0 34px}
  .acct-photo img{width:100%;height:100%;object-fit:cover;display:block}
  .acct-fallback{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#e7ecff;background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04));border:1px solid var(--line-soft)}
  .acct-meta{min-width:0}
  .acct-name{font-weight:600;font-size:13px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .acct-sub{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  `,
  "</style></head>",
  "<body>",
  "<div class='app'>",

    "<aside class='sidebar'>",
      "<div class='nav-brand'>",
        "<div class='logo'>", INLINE_LOGO, "</div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a href='/'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Image Generator</span></a>",
        "<a href='/storyboards'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg><span>Storyboards</span></a>",
        "<a href='/archive'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Archive</span></a>",
        "<a class='active' href='/usage' aria-current='page'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3v18h18'/><path d='M7 15l5-5 4 4 5-6'/></svg><span>Usage</span></a>",
        "<span class='sep'></span>",
        // Account badge
        "<div class='account' id='accountCard' aria-live='polite'>",
          "<div class='acct-photo'>",
            "<img id='acctAvatar' alt='' style='display:none'/>",
            "<div id='acctFallback' class='acct-fallback' aria-hidden='true' style='display:none'>?</div>",
          "</div>",
          "<div class='acct-meta'>",
            "<div id='acctName' class='acct-name'>Signed in</div>",
            "<div id='acctSub' class='acct-sub'>Loading…</div>",
          "</div>",
        "</div>",
        "<a href='#' data-logout='1'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/><polyline points='16 17 21 12 16 7'/></svg><span>Logout</span></a>",
      "</nav>",
    "</aside>",

    "<main class='main'>",
      "<div class='wrap'>",

        "<div class='headerbar'>",
          "<div class='hgroup'><h1>Usage</h1><div class='sub'>Daily spend and activity by type.</div></div>",
          "<div class='range-row'>",
            "<div class='date-field'><label>From</label><div class='date-wrap'><input id='from' type='date'/><button id='fromBtn' class='date-btn' type='button' aria-label='Open from date'>",
              "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 14 12 8 18 14'/></svg>",
            "</button></div></div>",
            "<div class='date-field'><label>To</label><div class='date-wrap'><input id='to' type='date'/><button id='toBtn' class='date-btn' type='button' aria-label='Open to date'>",
              "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 14 12 8 18 14'/></svg>",
            "</button></div></div>",
            "<button id='apply' class='pill'>Apply</button>",
          "</div>",
        "</div>",

        "<div class='card' style='margin-bottom:12px'>",
          "<div class='rowh'>",
            "<strong>Quick ranges</strong>",
            "<div class='range-presets'>",
              "<button class='pill' data-range='today'>Today</button>",
              "<button class='pill' data-range='last7'>Last 7 days</button>",
              "<button class='pill' data-range='month'>This month</button>",
              "<button class='pill' data-range='year'>This year</button>",
            "</div>",
          "</div>",
        "</div>",

        "<div class='cards'>",
          "<div class='kpi'><div class='label'>Total (EUR)</div><div id='kpiTotal' class='val'>€0.00</div></div>",
          "<div class='kpi'><div class='label'>Text (EUR)</div><div id='kpiText' class='val'>€0.000</div></div>",
          "<div class='kpi'><div class='label'>Image (EUR)</div><div id='kpiImage' class='val'>€0.00</div></div>",
          "<div class='kpi'><div class='label'>Upscale (EUR)</div><div id='kpiUpscale' class='val'>€0.00</div></div>",
        "</div>",

        "<div class='grid' style='margin-top:14px'>",
          "<div class='card'>",
            "<div class='rowh'><strong>Daily spend</strong><span class='subhint'>EUR per day</span></div>",
            "<div id='chartDaily' class='chart'><canvas id='cDaily' aria-label='Daily spend line chart'></canvas></div>",
          "</div>",
          "<div class='card'>",
            "<div class='rowh'><strong>Number of actions</strong><span class='subhint'>Images / Text / Upscale</span></div>",
            "<div id='chartModels' class='chart'><canvas id='cUsage' aria-label='Usage bar chart'></canvas></div>",
          "</div>",
        "</div>",

        "<div class='card' style='margin-top:14px'>",
          "<div class='rowh'><strong>Day by day</strong></div>",
          "<div id='table' class='table'></div>",
        "</div>",

        "<footer class='site-footer'>Made by Sequence Five</footer>",
      "</div>",
    "</main>",
  "</div>",
  // Firebase config + guard
  "<script>window.FB_CONFIG=", JSON.stringify({ apiKey: API_KEY, authDomain: AUTH_DOMAIN, projectId: PROJECT_ID }), ";</script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'></script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js'></script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js'></script>",
  "<script>",
  `
  (function(){
    const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

    function setBadge(name, sub, photo){
      var nameEl = document.getElementById('acctName');
      var subEl  = document.getElementById('acctSub');
      var imgEl  = document.getElementById('acctAvatar');
      var fbEl   = document.getElementById('acctFallback');
      nameEl.textContent = name || 'Signed in';
      subEl.textContent  = sub || 'Online';
      if (photo) {
        imgEl.src = photo;
        imgEl.alt = (name || 'User') + ' profile photo';
        imgEl.style.display = '';
        fbEl.style.display = 'none';
      } else {
        var initials = (name || sub || 'U').trim().split(/\\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('');
        fbEl.textContent = initials || 'U';
        fbEl.style.display = '';
        imgEl.style.display = 'none';
      }
    }

    async function getProfileFromFirestore(user){
      try{
        var db = firebase.firestore();
        var snap = await db.collection('users').doc(user.uid).get();
        if (snap.exists){
          var d = snap.data() || {};
          return {
            name:  d.name || d.displayName || user.displayName || 'Signed in',
            sub:   d.username || d.handle || user.email || 'Online',
            photo: d.photoURL || d.avatar || user.photoURL || '',
            updatedAt: d.updatedAt || null
          };
        }
      }catch(e){}
      return {
        name:  user.displayName || 'Signed in',
        sub:   user.email || 'Online',
        photo: user.photoURL || ''
      };
    }

    function readCache(uid){
      try{
        var raw = localStorage.getItem('acct:'+uid);
        if (!raw) return null;
        var obj = JSON.parse(raw);
        if (!obj || !obj.t) return null;
        var now = Date.now();
        if (now - obj.t > CACHE_TTL_MS) return null;
        return obj;
      }catch(_){ return null; }
    }

    function writeCache(uid, data){
      try{
        localStorage.setItem('acct:'+uid, JSON.stringify({ ...data, t: Date.now() }));
      }catch(_){}
    }

    if (!firebase.apps.length) firebase.initializeApp(window.FB_CONFIG);
    firebase.auth().onAuthStateChanged(async function(user){
      if (!user) { window.location.replace('/login'); return; }

      var cached = readCache(user.uid);
      if (cached) setBadge(cached.name, cached.sub, cached.photo);

      if (!cached){
        var prof = await getProfileFromFirestore(user);
        setBadge(prof.name, prof.sub, prof.photo);
        writeCache(user.uid, prof);
      }
    });

    document.addEventListener('DOMContentLoaded', function(){
      var logoutLink = Array.from(document.querySelectorAll('.nav a')).find(a => /logout/i.test(a.textContent || ''));
      if (logoutLink) {
        logoutLink.addEventListener('click', function(e){
          e.preventDefault();
          firebase.auth().signOut().then(()=>window.location.replace('/login'));
        });
      }
    });
  })();
  `,
  "</script>",
  "<script src='https://cdn.jsdelivr.net/npm/chart.js'></script>",
  "<script src='/assets/usage.js'></script>",

  "<script>window.FIREBASE_CONFIG={apiKey:", JSON.stringify(process.env.FIREBASE_WEB_API_KEY || ""), ",authDomain:", JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || ""), ",projectId:", JSON.stringify(process.env.FIREBASE_PROJECT_ID || ""), "};</script>",


  "</body></html>"
].join("");
