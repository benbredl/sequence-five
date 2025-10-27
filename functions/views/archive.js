// functions/views/archive.js
import { BASE_STYLES } from "./baseStyles.js";

// Firebase client config from env
const API_KEY = process.env.FIREBASE_WEB_API_KEY || "";
const AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || "";
const PROJECT_ID =
  (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : "") ||
  process.env.GCLOUD_PROJECT ||
  "";

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
        "<div class='logo'><img src='/images/app-logo.svg' alt='Sequence Five logo'/></div>",
        "<div class='nav-title'>Sequence Five</div>",
      "</div>",
      "<nav class='nav'>",
        "<a href='/'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Image Generator</span></a>",
        "<a href='/storyboards'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15V6a2 2 0 0 0-2-2H6'/><path d='M3 7v11a2 2 0 0 0 2 2h11'/><rect x='7' y='7' width='10' height='10' rx='2'/></svg><span>Storyboards</span></a>",
        "<a class='active' href='/archive' aria-current='page'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='7' height='7' rx='2'/><rect x='14' y='3' width='7' height='7' rx='2'/><rect x='14' y='14' width='7' height='7' rx='2'/><rect x='3' y='14' width='7' height='7' rx='2'/></svg><span>Archive</span></a>",
        "<a href='/usage'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 3v18h18'/><path d='M7 15l5-5 4 4 5-6'/></svg><span>Usage</span></a>",
        "<span class='sep'></span>",

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

  "<script src='/assets/nbviewer.js'></script>",
  "<script src='/assets/archive.js'></script>",
  "</body></html>"
].join("");
