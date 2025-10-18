// functions/views/baseStyles.js
export const BASE_STYLES = `
/* ========= MODERN DASH / NEO-GLASS THEME ========= */
@supports (font-variation-settings: normal) {
  @font-face{
    font-family:"InterVar";
    src:local("InterVariable"),
         url(https://rsms.me/inter/font-files/InterVariable.woff2?v=4.0) format("woff2");
    font-weight:100 900; font-display:swap;
  }
}

/* ---- Tokens tuned to the reference vibe ---- */
:root{
  /* Surfaces */
  --bg:#0b0d14;           /* page background */
  --panel:#0f111a;        /* deep panel base */
  --glass1:rgba(255,255,255,.065);
  --glass2:rgba(255,255,255,.028);
  --line:#23283d;         /* hairline borders */

  /* Text */
  --ink:#EEF2FF;
  --muted:#9aa3b2;

  /* Accents */
  --violet:#8B5CF6;
  --violet-2:#7C3AED;
  --cyan:#22D3EE;
  --success:#34d399;
  --warning:#f59e0b;

  /* Radii & Shadows */
  --radius:20px;
  --radius-lg:22px;
  --radius-xl:28px;
  --shadow-deep:0 22px 60px rgba(0,0,0,.55);
  --shadow-soft:0 10px 30px rgba(0,0,0,.35);

  /* Motion */
  --fast:150ms;
  --ease:cubic-bezier(.2,.8,.2,1);
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:InterVar,Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  color:var(--ink);

  background:
    radial-gradient(1200px 800px at 90% -10%, rgba(139,92,246,.16), transparent 60%),
    radial-gradient(1000px 600px at -10% 20%, rgba(34,211,238,.14), transparent 60%),
    linear-gradient(180deg,#0a0c13,#090b12 40%,#080a11);
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-size: cover;

  overflow-y:auto;
}

/* subtle ambience */
body::before{
  content:""; position:fixed; inset:-15%;
  background-image:
    radial-gradient(2px 2px at 16% 30%, rgba(255,255,255,.25) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 60% 70%, rgba(255,255,255,.18) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 82% 20%, rgba(255,255,255,.14) 45%, transparent 46%),
    radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,.12) 45%, transparent 46%);
  animation: drift 60s linear infinite; opacity:.28; pointer-events:none;
}
@keyframes drift { from{ transform:translateY(0) } to{ transform:translateY(-220px) } }

/* ========= APP LAYOUT ========= */
.app{min-height:100vh;display:grid;grid-template-columns:240px 1fr;background:transparent}

.sidebar{
  position:sticky; top:0; align-self:start; height:100vh;
  padding:18px 14px 20px 16px;
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025));
  border-right:1px solid var(--line);
}
.nav-brand{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.nav-brand .logo{
  width:36px;height:36px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(139,92,246,.28),rgba(34,211,238,.14));
  border:1px solid #3a3561; box-shadow:0 8px 24px rgba(124,58,237,.25), inset 0 1px 0 rgba(255,255,255,.08)
}
.nav-brand img{width:22px;height:22px;display:block}
.nav-title{
  font-weight:900;letter-spacing:.2px;
  background:linear-gradient(90deg,#fff,#d8dafe 40%,#a5b4fc 70%);
  -webkit-background-clip:text;background-clip:text;color:transparent
}

.nav{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.nav a{
  display:flex;align-items:center;gap:10px;text-decoration:none;
  color:#cfd6f3;font-weight:700;font-size:13px;
  padding:9px 12px;border-radius:12px;border:1px solid transparent;
  transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease), background var(--fast) var(--ease), border-color var(--fast) var(--ease);
}
.nav svg{width:18px;height:18px;flex:0 0 18px;opacity:.95}
.nav a:hover{background:rgba(255,255,255,.05);border-color:#2a3354;color:#eef2ff;transform:translateY(-1px)}
.nav a.active{
  background:linear-gradient(180deg, rgba(139,92,246,.18), rgba(34,211,238,.10));
  border-color:#343d66; color:#ffffff; box-shadow:0 10px 30px rgba(124,58,237,.18)
}
.nav .sep{height:1px;background:#262c44;margin:10px 4px}

/* Main column uses flex so footer naturally sits after content */
.main{min-height:100vh;display:flex;flex-direction:column}
.wrap{max-width:1280px;margin:28px auto 40px;padding:0 22px}

/* content header inside main */
.headerbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.headerbar .hgroup h1{margin:0;font-size:22px;letter-spacing:.2px}
.headerbar .sub{color:var(--muted);font-size:12px;margin-top:4px}

/* ========= CARDS ========= */
.card,
.panel{
  background:linear-gradient(180deg,var(--glass1),var(--glass2));
  border:1px solid var(--line);
  border-radius:var(--radius);
  padding:16px;
  backdrop-filter:blur(10px);
  box-shadow:var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,.03);
}
.frame{
  background:linear-gradient(180deg,#0b0f22,#0a0d1e);
  border:1px solid var(--line); border-radius:22px; overflow:hidden;
  box-shadow:0 10px 40px rgba(124,58,237,.18), inset 0 1px 0 rgba(255,255,255,.03);
}

/* ========= LAYOUT GRIDS ========= */
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
@media (max-width: 1100px){ .grid{ grid-template-columns: 1fr } }

.grid-gal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@media (max-width: 1200px){ .grid-gal{grid-template-columns:repeat(3,minmax(0,1fr))} }
@media (max-width: 840px){ .grid-gal{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width: 520px){ .grid-gal{grid-template-columns:1fr} }

/* Gallery cards */
.card-gal{
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025));
  border:1px solid var(--line);
  border-radius:16px; overflow:hidden; display:flex; flex-direction:column;
  box-shadow:var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,.03);
  transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease);
}
.card-gal:hover{transform:translateY(-1px);filter:brightness(1.03)}
.card-gal img{display:block;width:100%;height:auto}

/* Overlay for cards + fullscreen controls */
.gal-overlay{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 100%);display:flex;align-items:center;justify-content:space-between;gap:6px;opacity:0;transform:translateY(8px);transition:opacity .22s ease, transform .22s ease;z-index:3;pointer-events:auto}
.card-gal:hover .gal-overlay{opacity:1;transform:translateY(0)}
.gal-meta{font-size:12px;color:#e6e9ff;display:flex;align-items:center;gap:8px}
.gal-actions{display:flex;gap:6px;align-items:center}
.type-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:3px 7px;font-size:11px;font-weight:800;letter-spacing:.2px}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;background:transparent;padding:0;cursor:pointer;transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease);opacity:.95;color:#fff}
.icon-btn:hover{filter:brightness(1.08)} .icon-btn:active{transform:translateY(1px)}
.icon-btn svg{width:16px;height:16px;display:block}

/* fullscreen viewer tweaks */
.viewer-bottombar .icon-btn{width:38px;height:38px}
.viewer-bottombar .icon-btn svg{width:20px;height:20px}

/* ========= FORMS ========= */
label{display:block;font-size:13px;color:var(--muted);margin:8px 0}
textarea,input,select{
  width:100%; background:linear-gradient(180deg,#0b0f22,#0a0e1e);
  color:var(--ink); border:1px solid #2b3359; border-radius:14px;
  padding:13px 14px; font-size:14px; outline:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03); transition:box-shadow .2s,border-color .2s;
}
textarea{min-height:120px;resize:vertical}
textarea:focus,input:focus{ border-color:#3a4680; box-shadow:0 0 0 3px rgba(139,92,246,.18) }

/* Drop zone (generator) */
.drop{position:relative;border:1px dashed #2a3354;border-radius:18px;overflow:hidden;min-height:220px;background:linear-gradient(180deg,#0b0f22,#0a0e1e)}
.drop:hover{border-color:#3a4680;box-shadow:0 12px 36px rgba(124,58,237,.18)}
.drop.is-drag{border-color:#4b5aa6}
.drop img.preview{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.drop .drop-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#cbd3ed}
.drop .circle{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.04));border:1px solid #2f375a;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}

/* ========= BUTTONS ========= */
button,.btn{
  background:
    radial-gradient(100% 100% at 60% 0%, rgba(255,255,255,.18), transparent 40%),
    linear-gradient(180deg, var(--violet), var(--violet-2));
  color:white; border:1px solid #4b2cad; border-radius:14px;
  padding:12px 16px; font-weight:800; font-size:14px; cursor:pointer;
  transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease), box-shadow var(--fast) var(--ease);
  box-shadow:0 14px 40px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.14);
}
button:hover{ filter:brightness(1.06) } button:active{ transform:translateY(1px) }
.btn-ghost{
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
  border:1px solid #2f375a; color:#d7dbff; box-shadow:none;
}
.btn-neo{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  height:36px; padding:0 14px; border-radius:999px; font-weight:800; font-size:13px; color:#eef2ff;
  border:1.5px solid transparent; cursor:pointer;
  background:linear-gradient(#0b0f22,#0b0f22) padding-box,linear-gradient(90deg,#a78bfa 0%,#22d3ee 100%) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
}
.btn-neo:hover{ filter:brightness(1.06); box-shadow:0 8px 26px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.12) }
.btn-neo:active{ transform:translateY(1px) }
button:disabled{ opacity:.6; cursor:not-allowed }

.pill{ display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); border:1px solid #2f375a; color:#c7ceed; font-size:12px; font-weight:700 }
.badge{ font-size:12px;padding:6px 10px;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border:1px solid #2f375a; color:#b8c0d9 }

/* ========= RESULTS (generator) ========= */
.result-card{background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.025));border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-soft);margin-bottom:12px}
.result-media{position:relative;aspect-ratio:16/9;background:#0b0f22}
.skeleton{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.spinner-lg{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#a78bfa;animation:spin .9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ========= FOOTER ========= */
.site-footer{
  margin-top:24px;
  padding:22px 10px;
  text-align:center;
  color:#a8b0c9;
  font-size:12px;
  border-top:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
  border-radius:18px;
}
`;
