// functions/views/image-generator.js
import { BASE_STYLES } from "./baseStyles.js";
import { DEFAULT_SYSTEM_PROMPT } from "../config.js";

// Inject Firebase client config from env
const API_KEY = process.env.FIREBASE_WEB_API_KEY || "";
const AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || "";
const PROJECT_ID =
  (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : "") ||
  process.env.GCLOUD_PROJECT ||
  "";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<link rel='preconnect' href='https://firebasestorage.googleapis.com' crossorigin>",
  "<title>Sequence Five — Image Generator</title>",
  "<style>", BASE_STYLES, `
/* --- Generator-page-only tweaks --- */
#resultsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#resultsGrid .card-gal{position:relative}
img.blur-up{filter:blur(14px);transform:scale(1.02);transition:filter .35s ease, transform .35s ease, opacity .35s ease;display:block;width:100%;height:auto;object-fit:cover}
img.blur-up.is-loaded{filter:blur(0);transform:none}
a#showAll.pill{display:inline-flex;align-items:center;justify-content:center;height:34px;padding:0 14px;border-radius:10px;border:1px solid var(--line-soft);background:var(--glass1);text-decoration:none;font-weight:500;opacity:.88}
a#showAll.pill:hover{opacity:1}
#prompt{font-size:12px}

/* --- Account badge (logged-in indicator) --- */
.account{margin:10px 6px 0;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;border:1px solid var(--line-soft);background:linear-gradient(180deg, var(--glass1), var(--glass2));box-shadow:var(--shadow-soft)}
.acct-photo{width:34px;height:34px;border-radius:10px;overflow:hidden;border:1px solid var(--line-soft);background:rgba(255,255,255,.06);flex:0 0 34px}
.acct-photo img{width:100%;height:100%;object-fit:cover;display:block}
.acct-fallback{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#e7ecff;background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04));border:1px solid var(--line-soft)}
.acct-meta{min-width:0}
.acct-name{font-weight:600;font-size:13px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acct-sub{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Skeleton state */
.skel{position:relative;overflow:hidden;background:rgba(255,255,255,.06)}
.skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent);animation:skel 1.2s linear infinite}
@keyframes skel{100%{transform:translateX(100%)}}
.acct-name.skel{height:12px;border-radius:6px}
.acct-sub.skel{height:10px;border-radius:6px;width:65%;margin-top:6px}
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

  // Firebase config + guard
  "<script>window.FB_CONFIG=", JSON.stringify({ apiKey: API_KEY, authDomain: AUTH_DOMAIN, projectId: PROJECT_ID }), ";</script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'></script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js'></script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js'></script>",
  "<script>",
  `
  (function(){
    var KEY='sf:acct', TTL=6*60*60*1000; // 6 hours

    function readCache(){
      try{
        var raw=localStorage.getItem(KEY); if(!raw) return null;
        var obj=JSON.parse(raw); if(!obj||!obj.ts) return null;
        if(Date.now()-obj.ts>TTL) return null;
        return obj;
      }catch(_){ return null }
    }
    function writeCache(data){
      try{ localStorage.setItem(KEY, JSON.stringify({ ...data, ts: Date.now() })); }catch(_){}
    }
    function clearCache(){ try{ localStorage.removeItem(KEY); }catch(_){ } }
    function unskeleton(){
      var n=document.getElementById('acctName'); var s=document.getElementById('acctSub');
      n && n.classList.remove('skel');
      s && s.classList.remove('skel');
    }
    function populate(data){
      var nameEl=document.getElementById('acctName');
      var subEl=document.getElementById('acctSub');
      var imgEl=document.getElementById('acctAvatar');
      var fbEl=document.getElementById('acctFallback');
      var name=data.name||''; var sub=data.sub||''; var photo=data.photo||'';
      unskeleton();
      nameEl.textContent=name; subEl.textContent=sub;
      if(photo){
        imgEl.src=photo; imgEl.alt=(name||'User')+' profile photo'; imgEl.style.display=''; fbEl.style.display='none';
      }else{
        var initials=(name||sub||'U').trim().split(/\\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('');
        fbEl.textContent=initials||'U'; fbEl.style.display=''; imgEl.style.display='none';
      }
    }

    // Pre-populate immediately from cache to avoid any loading flicker
    var bootCached = readCache();
    if (bootCached) { populate(bootCached); }

    if (!firebase.apps.length) firebase.initializeApp(window.FB_CONFIG);
    firebase.auth().onAuthStateChanged(async function(user){
      if (!user) { clearCache(); window.location.replace('/login'); return; }

      // If cache exists for this user, we are done. Do NOT fetch Firestore.
      var cached = readCache();
      if (cached && cached.uid === user.uid) { return; }

      // Otherwise, populate from Auth quickly, then fetch Firestore once and cache.
      populate({
        name: user.displayName || '',
        sub: user.email || '',
        photo: user.photoURL || '',
        uid: user.uid
      });

      try{
        var db=firebase.firestore();
        var snap=await db.collection('users').doc(user.uid).get();
        if(snap.exists){
          var d=snap.data()||{};
          var name=d.name||d.displayName||user.displayName||'';
          var sub=d.username||d.handle||user.email||'';
          var photo=d.photoURL||d.avatar||user.photoURL||'';
          var obj={name, sub, photo, uid:user.uid};
          writeCache(obj);
          populate(obj);
        }else{
          writeCache({name:user.displayName||'', sub:user.email||'', photo:user.photoURL||'', uid:user.uid});
        }
      }catch(_){}
    });

    // Wire Logout link (and clear cache)
    document.addEventListener('DOMContentLoaded', function(){
      var logoutLink = Array.from(document.querySelectorAll('.nav a')).find(a => /logout/i.test(a.textContent || ''));
      if (logoutLink) {
        logoutLink.addEventListener('click', function(e){
          e.preventDefault();
          firebase.auth().signOut().then(()=>{ try{localStorage.removeItem(KEY);}catch(_){ } window.location.replace('/login'); });
        });
      }
    });
  })();
  `,
  "</script>",

  "<script src='/assets/nbviewer.js'></script>",
  "<script src='/assets/image-generator.js'></script>",
  "</body></html>"
].join("");
