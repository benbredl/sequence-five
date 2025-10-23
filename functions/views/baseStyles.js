// functions/views/baseStyles.js
export const BASE_STYLES = `
/* ==== Theme: dark, transparent/glassy cards (no blue fills) ==== */
/* --- Global font setup (centralized) --- */
@font-face{
  font-family:"Open Sans Var";
  src: local("Open Sans Variable"),
       url(https://fonts.gstatic.com/s/opensans/v40/memwYaGs126MiZpBA-UFVZ0b.woff2) format("woff2");
  font-weight:300 800;
  font-display:swap;
}

:root{
  --bg:#0a0d14;
  --panel: transparent;
  --glass1: rgba(255,255,255,.02);
  --glass2: rgba(255,255,255,.01);
  --line: rgba(152,170,210,.22);
  --line-soft: rgba(152,170,210,.16);

  --ink:#EEF3FF;
  --ink-dim:#C7D1E9;
  --muted:#9aa3b2;

  /* BLUE primary */
  --blue:#4F8DFD;
  --blue-2:#1E68F8;

  --r-sm:12px;
  --r-md:16px;
  --r-lg:20px;
  --shadow-deep:0 30px 80px rgba(0,0,0,.45);
  --shadow-soft:0 12px 34px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.04);

  --fast:160ms;
  --ease:cubic-bezier(.22,.8,.28,1);

  --wrap-max:1200px;
  --wrap-w:60vw;
}

/* Use Open Sans everywhere by default */
body{
  /* keep your existing body styles, just ensure this family is first */
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  font-variation-settings:"wght" 400;
}

/* Ensure consistent semi-bold where needed (matches Storyboards) */
.nav-brand .nav-title{ font-weight:600; }
.headerbar .hgroup h1{ font-weight:600; }

/* Also make buttons match (Storyboards look) */
button,.btn,.btn-ghost,.pill,
textarea,input,select {
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  color:var(--ink);
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  font-variation-settings:"wght" 400;
  background:
    radial-gradient(1200px 800px at 95% -10%, rgba(79,141,253,.12), transparent 60%),
    radial-gradient(1000px 600px at -10% 20%, rgba(34,211,238,.10), transparent 60%),
    linear-gradient(180deg,#090b12,#080a11 40%,#07090f);
  background-attachment:fixed;
}
body::before{
  content:""; position:fixed; inset:-15%;
  background-image:
    radial-gradient(2px 2px at 16% 30%, rgba(255,255,255,.16) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 60% 70%, rgba(255,255,255,.11) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 82% 20%, rgba(255,255,255,.10) 45%, transparent 46%),
    radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,.08) 45%, transparent 46%);
  animation: drift 60s linear infinite; opacity:.18; pointer-events:none;
}
@keyframes drift { from{ transform:translateY(0) } to{ transform:translateY(-220px) } }

/* Layout */
.app{min-height:100vh;display:grid;grid-template-columns:260px 1fr}
.sidebar{
  position:sticky; top:0; height:100vh; align-self:start;
  padding:18px 16px 20px;
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
  border-right:1px solid var(--line-soft);
}
.nav-brand{display:flex;align-items:center;gap:12px;margin:4px 6px 16px}
.nav-brand .logo{
  width:36px;height:36px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
  background:transparent;border:1px solid var(--line-soft); box-shadow: var(--shadow-soft);
}
.nav-brand img{width:22px;height:22px;display:block}
/* Make brand semi-bold (600), not bold */
.nav-title{font-weight:600;letter-spacing:.2px;color:var(--ink);text-shadow:0 1px 0 rgba(0,0,0,.25)}

.nav{display:flex;flex-direction:column;gap:6px;margin-top:6px}
.nav a{
  display:flex;align-items:center;gap:12px;text-decoration:none;color:#cfd6f3;
  font-weight:600;font-size:13px;padding:10px 12px;border-radius:12px;border:1px solid transparent;
  transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease), background var(--fast) var(--ease), border-color var(--fast) var(--ease);
}
.nav svg{width:18px;height:18px;flex:0 0 18px;opacity:.95}
.nav a:hover{background:rgba(255,255,255,.05);border-color:var(--line-soft);color:#eef2ff;transform:translateY(-1px)}
.nav a.active{
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
  border-color:var(--line); color:#ffffff; box-shadow:0 10px 26px rgba(0,0,0,.24)
}
.nav .sep{height:1px;background:var(--line-soft);margin:12px 6px}

/* Main + wrap */
.main{
  min-height:100vh;
  display:flex; /* column is default in file, but we explicitly set below on wrap */
}
/* Make the inner wrap a flex column that fills the column height so footer can push to bottom */
.wrap{
  width:min(var(--wrap-max), var(--wrap-w));
  margin-inline:auto;
  padding:32px 18px 0;
  display:flex;
  flex-direction:column;
  min-height:100%; /* fill the .main column */
}
@media (max-width:1100px){ .wrap{ width:min(94vw, var(--wrap-max)) } }
@media (max-width:640px){ .wrap{ width:96vw; padding:24px 12px 0 } }

/* Header */
.headerbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
/* Page title should be semi-bold (600) */
.headerbar .hgroup h1{margin:0;font-size:22px;letter-spacing:.2px;font-weight:600}
.headerbar .sub{color:var(--muted);font-size:12px;margin-top:4px}

/* Cards (transparent) */
.card,.panel,.frame,.kpi,.result-card{
  background: linear-gradient(180deg, var(--glass1), var(--glass2));
  border:1px solid var(--line-soft);
  border-radius:16px;
  padding:16px;
  backdrop-filter: blur(8px) saturate(110%);
  box-shadow: var(--shadow-soft);
}
.frame{overflow:hidden}

/* Grids */
.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:18px}
@media (max-width:1100px){ .grid{grid-template-columns:1fr} }

.grid-gal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@media (max-width:1200px){ .grid-gal{grid-template-columns:repeat(3,minmax(0,1fr))} }
@media (max-width:840px){ .grid-gal{grid-template-columns:repeat(2,minmax(0,1fr))} }
@media (max-width:520px){ .grid-gal{grid-template-columns:1fr} }

/* Archive cards + overlay */
.card-gal{border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:transform var(--fast) var(--ease),filter var(--fast) var(--ease)}
.card-gal:hover{transform:translateY(-1px);filter:brightness(1.03)}
.card-gal img{display:block;width:100%;height:auto}
.gal-overlay{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:linear-gradient(0deg, rgba(0,0,0,.60) 0%, rgba(0,0,0,0) 100%);display:flex;align-items:center;justify-content:space-between;gap:6px;opacity:0;transform:translateY(8px);transition:opacity .22s ease, transform .22s ease;z-index:3;pointer-events:auto}
.card-gal:hover .gal-overlay{opacity:1;transform:translateY(0)}
.gal-meta{font-size:12px;color:#e6e9ff;display:flex;align-items:center;gap:8px}
.gal-actions{display:flex;gap:6px;align-items:center}
.type-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid var(--line-soft);background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));color:#c7ceed;padding:3px 7px;font-size:11px;font-weight:800;letter-spacing:.2px}
.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;background:transparent;padding:0;cursor:pointer;transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease);opacity:.95;color:#fff}
.icon-btn:hover{filter:brightness(1.08)}
.icon-btn svg{width:16px;height:16px;display:block}

/* Forms */
label{display:block;font-size:13px;color:var(--muted);margin:8px 0}

/* Ensure inputs & placeholders use Open Sans */
textarea,input,select{
  width:100%;
  background:linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.03));
  color:var(--ink);
  border:1px solid var(--line-soft);
  border-radius:14px;
  padding:13px 14px;
  font-size:14px;
  outline:none;
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
  transition:box-shadow .2s,border-color .2s;
}
textarea{min-height:120px;resize:vertical}
textarea:focus,input:focus{ border-color:var(--line); box-shadow:0 0 0 3px rgba(79,141,253,.22) }

/* Placeholder typography + color */
textarea::placeholder,
input::placeholder{
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  font-weight:400;
  color:var(--muted);
  opacity:1; /* Firefox */
}

/* Dropzone */
.drop{position:relative;border:1px dashed var(--line-soft);border-radius:18px;overflow:hidden;min-height:220px;background:linear-gradient(180deg, var(--glass1), var(--glass2))}
.drop.is-drag{border-color:var(--line)}
.drop img.preview{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.drop .drop-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#d5dcf8;font-weight:600;font-size:13px}

/* Buttons (BLUE) — semi-bold & slightly smaller text */
button,.btn{
  background:
    radial-gradient(100% 100% at 60% 0%, rgba(255,255,255,.22), transparent 40%),
    linear-gradient(180deg, var(--blue), var(--blue-2));
  color:white; border:1px solid rgba(26,83,217,.9); border-radius:14px;
  padding:12px 16px; font-weight:600; font-size:13px; cursor:pointer; /* 600 = semi-bold, 13px smaller */
  transition:transform var(--fast) var(--ease), filter var(--fast) var(--ease), box-shadow var(--fast) var(--ease);
  box-shadow:0 14px 40px rgba(37,115,255,.28), inset 0 1px 0 rgba(255,255,255,.14);
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
}
button:hover{ filter:brightness(1.06) } button:active{ transform:translateY(1px) }
.btn-ghost{
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
  border:1px solid var(--line-soft); color:#d7dbff; box-shadow:none;
  font-weight:600; font-size:13px;
  font-family:"Open Sans Var","Open Sans",Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
}
button:disabled{ opacity:.6; cursor:not-allowed }

.pill{ display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); border:1px solid var(--line-soft); color:#c7ceed; font-size:12px; font-weight:700 }

/* Results */
.result-card{margin-bottom:12px}
.result-media{position:relative;aspect-ratio:16/9;background:linear-gradient(180deg, var(--glass1), var(--glass2)); border:1px solid var(--line-soft); border-radius:14px; overflow:hidden}
.skeleton{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.spinner-lg{width:32px;height:32px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:var(--blue);animation:spin .9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* Charts & Tables */
.chart{height:260px;border-radius:16px;border:1px solid var(--line-soft);padding:12px;background:linear-gradient(180deg, var(--glass1), var(--glass2))}
.table{margin-top:14px;border:1px solid var(--line-soft);border-radius:12px;overflow:hidden;background:linear-gradient(180deg, var(--glass1), var(--glass2))}
.table table{width:100%;border-collapse:collapse;font-size:13px}
.table th,.table td{padding:10px;border-bottom:1px solid var(--line-soft)} .table th{text-align:left;color:#c8d0ee;font-weight:700}

/* Footer pinned to bottom via flex on .wrap */
.site-footer{
  margin-top:auto;
  padding:20px 12px;
  text-align:center;
  color:#a8b0c9;
  font-size:12px;
}

/* Progressive image utility used across pages (Archive/Generator/Storyboards) */
img.blur-up{
  filter: blur(14px);
  transform: scale(1.02);
  transition: filter .35s ease, transform .35s ease, opacity .35s ease;
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
img.blur-up.is-loaded{
  filter: blur(0);
  transform: none;
}
`;
