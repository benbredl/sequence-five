// functions/views/login.js
import { BASE_STYLES } from "./baseStyles.js";

// Pull Firebase client config from env (server side) and embed for browser
const API_KEY = process.env.FIREBASE_WEB_API_KEY || "";
const AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || "";
const PROJECT_ID =
  (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : "") ||
  process.env.GCLOUD_PROJECT ||
  "";

export const HTML = [
  "<!doctype html><html lang='en'><head><meta charset='utf-8'/>",
  "<meta name='viewport' content='width=device-width, initial-scale=1'/>",
  "<title>Sequence Five — Login</title>",
  "<link rel='icon' href='/images/app-logo.svg'/>",
  "<style>",
  BASE_STYLES,
  `
  .login-wrap{
    max-width:360px;margin:12vh auto 0; padding:20px;
    background:linear-gradient(180deg, var(--glass1), var(--glass2));
    border:1px solid var(--line-soft); border-radius:16px; box-shadow:var(--shadow-soft);
  }
  .login-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .login-head .logo{width:36px;height:36px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line-soft)}
  .login-head img{width:22px;height:22px;display:block}
  .login-title{font-weight:600;font-size:18px}
  .login-form{margin-top:10px;display:flex;flex-direction:column;gap:10px}
  .login-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;margin-top:6px}
  .hint-err{color:#ff9ea8;font-size:12px;min-height:16px}
  `,
  "</style></head><body>",
  "<div class='wrap' style='width:min(520px,92vw);'>",
    "<div class='login-wrap'>",
      "<div class='login-head'>",
        "<div class='logo'><img src='/images/app-logo.svg' alt='Sequence Five logo'/></div>",
        "<div class='login-title'>Sign in</div>",
      "</div>",
      "<div class='login-form'>",
        "<label>Email</label><input id='email' type='email' placeholder='you@example.com' autocomplete='email'/>",
        "<label>Password</label><input id='password' type='password' placeholder='••••••••' autocomplete='current-password'/>",
        "<div class='login-actions'>",
          "<button id='loginBtn' class='btn'>Sign in</button>",
        "</div>",
        "<div id='err' class='hint-err'></div>",
      "</div>",
    "</div>",
    "<footer class='site-footer'>Made by Sequence Five</footer>",
  "</div>",

  // Firebase client config + auth libs (compat for simplicity)
  "<script>window.FB_CONFIG=", JSON.stringify({ apiKey: API_KEY, authDomain: AUTH_DOMAIN, projectId: PROJECT_ID }), ";</script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'></script>",
  "<script src='https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js'></script>",
  "<script>",
  `
  (function(){
    if (!window.FB_CONFIG || !window.FB_CONFIG.apiKey || !window.FB_CONFIG.authDomain || !window.FB_CONFIG.projectId) {
      document.getElementById('err').textContent = 'Missing Firebase client configuration.';
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(window.FB_CONFIG);

    // If already signed in, go to app
    firebase.auth().onAuthStateChanged(function(user){
      if (user) { window.location.replace('/'); }
    });

    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const errEl = document.getElementById('err');

    btn.addEventListener('click', async function(){
      errEl.textContent = '';
      btn.disabled = true;
      try{
        const e = (email.value || '').trim();
        const p = String(password.value || '');
        if (!e || !p) throw new Error('Enter email and password');
        await firebase.auth().signInWithEmailAndPassword(e, p);
        window.location.replace('/');
      }catch(e){
        errEl.textContent = e && e.message ? e.message : String(e);
      }finally{
        btn.disabled = false;
      }
    });

    // Enter key on password field
    password.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter') btn.click();
    });
  })();
  `,
  "</script>",
  "</body></html>"
].join("");
