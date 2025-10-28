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
  /* Header actions and segmented control */
  .header-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
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

  .seg{display:inline-flex;border:1px solid var(--line-soft);border-radius:12px;overflow:hidden;background:linear-gradient(180deg, var(--glass1), var(--glass2));box-shadow:var(--shadow-soft)}
  .seg-btn{
    appearance:none;background:transparent;border:0;margin:0;padding:8px 12px;
    color:#e7ecff;font-weight:600;cursor:pointer;position:relative;
  }
  .seg-btn[aria-pressed="true"]{
    background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.04));
  }
  .seg-btn + .seg-btn{border-left:1px solid var(--line-soft)}
  .seg-btn:disabled{opacity:.55;cursor:not-allowed;filter:saturate(.6)}
  .seg-btn:focus-visible{outline:2px solid #7c8cff;outline-offset:2px;border-radius:8px}

  /* Account badge (sidebar) */
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
            "<div class='seg' role='group' aria-label='Filter images'>",
              "<button id='segAll' class='seg-btn' aria-pressed='true' type='button'>All images</button>",
              "<button id='segMine' class='seg-btn' aria-pressed='false' type='button' disabled title='Sign in to view only your images'>My images</button>",
            "</div>",
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
  "<script src='/assets/archive.js'></script>",
  "</body></html>"
].join("");
