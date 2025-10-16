// functions/views/baseStyles.js
export const BASE_STYLES = `
/* ========= THEME ========= */
@supports (font-variation-settings: normal) {
  @font-face{
    font-family:"InterVar";
    src:local("InterVariable"),
         url(https://rsms.me/inter/font-files/InterVariable.woff2?v=4.0) format("woff2");
    font-weight:100 900; font-display:swap;
  }
}
:root{
  --bg:#0A0A18;
  --panel:#0E1024;
  --glass1:rgba(255,255,255,.06);
  --glass2:rgba(255,255,255,.03);
  --line:#252b46;
  --ink:#EEF2FF;
  --muted:#A1A8BE;

  --violet:#8B5CF6;
  --violet-2:#7C3AED;
  --pink:#F472B6;
  --cyan:#22D3EE;

  --radius:20px;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:InterVar,Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
  color:var(--ink);

  /* FIXED cosmic gradient background */
  background:
    radial-gradient(1200px 800px at 90% -10%, rgba(139,92,246,.20), transparent 60%),
    radial-gradient(1000px 600px at -10% 20%, rgba(34,211,238,.18), transparent 60%),
    linear-gradient(180deg,#080915,#070715 40%,#050512);
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-size: cover;

  overflow-y:auto;
}

/* starfield */
body::before{
  content:""; position:fixed; inset:-15%;
  background-image:
    radial-gradient(1.8px 1.8px at 14% 30%, rgba(255,255,255,.35) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 60% 70%, rgba(255,255,255,.25) 45%, transparent 46%),
    radial-gradient(1.2px 1.2px at 82% 20%, rgba(255,255,255,.20) 45%, transparent 46%),
    radial-gradient(1px 1px at 30% 85%, rgba(255,255,255,.18) 45%, transparent 46%);
  animation: drift 60s linear infinite; opacity:.35; pointer-events:none;
}
@keyframes drift { from{ transform:translateY(0) } to{ transform:translateY(-220px) } }

/* shell */
.wrap{max-width:1200px;margin:42px auto;padding:0 22px 80px} /* extra bottom padding */

/* ===== header / brand ===== */
header{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:26px}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.2px}
/* Logo wrapper = soft-glass pill with subtle glow */
.logo-wrap{
  width:34px;height:34px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center;
  background:
    radial-gradient(100% 100% at 70% 0%, rgba(255,255,255,.16), transparent 40%),
    linear-gradient(180deg, rgba(139,92,246,.30), rgba(34,211,238,.18));
  border:1px solid #3a3561;
  box-shadow: 0 8px 24px rgba(124,58,237,.25), inset 0 1px 0 rgba(255,255,255,.08);
}
.logo-img{
  width:22px; height:22px; object-fit:contain;
  filter: drop-shadow(0 2px 10px rgba(139,92,246,.35));
}
.brand span{
  font-size:22px;
  background:linear-gradient(90deg,#fff,#d8dafe 40%,#a5b4fc 70%);
  -webkit-background-clip:text; background-clip:text; color:transparent
}

/* nav */
nav a{
  color:#b8c0d9; text-decoration:none; margin-right:14px; font-weight:600;
  padding:8px 12px; border-radius:999px; border:1px solid transparent;
  transition:all .18s ease;
}
nav a:hover{ color:#e5e7ff; border-color:#2a3256; background:rgba(255,255,255,.04) }
nav a.active{
  color:#f0ecff; border-color:#343d66;
  background:linear-gradient(180deg, rgba(139,92,246,.18), rgba(34,211,238,.12));
}

/* ===== cards / containers ===== */
.card{
  background:linear-gradient(180deg,var(--glass1),var(--glass2));
  border:1px solid var(--line); border-radius:var(--radius); padding:18px;
  backdrop-filter:blur(10px); box-shadow:0 10px 30px rgba(2,6,23,.36), inset 0 1px 0 rgba(255,255,255,.03);
}

/* media frame (used on generators) */
.frame{
  background:linear-gradient(180deg,#0b0f22,#0a0d1e);
  border:1px solid var(--line); border-radius:22px; overflow:hidden;
  box-shadow:0 10px 40px rgba(124,58,237,.18), inset 0 1px 0 rgba(255,255,255,.03);
}
.frame img{ display:block; width:100%; height:auto }

/* layouts */
.grid{ display:grid; grid-template-columns:1.15fr .85fr; gap:18px }
@media (max-width: 980px){ .grid{ grid-template-columns: 1fr } }
.grid-gal{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px}

/* gallery cards */
.card-gal{
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  border:1px solid var(--line);
  border-radius:16px; overflow:hidden; display:flex; flex-direction:column;
  box-shadow: 0 10px 30px rgba(2,6,23,.45), inset 0 1px 0 rgba(255,255,255,.03);
}
.card-gal img{display:block;width:100%;height:auto}
.card-gal .meta{padding:12px}
.card-gal .ts{font-size:12px;color:#9aa4b2}

/* ===== form elements ===== */
label{display:block;font-size:13px;color:var(--muted);margin:8px 0}
textarea,input,select{
  width:100%; background:linear-gradient(180deg,#0b0f22,#0a0e1e);
  color:var(--ink); border:1px solid #2b3359; border-radius:14px;
  padding:13px 14px; font-size:14px; outline:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03); transition:box-shadow .2s,border-color .2s;
}
textarea{min-height:130px;resize:vertical}
textarea:focus,input:focus{ border-color:#3a4680; box-shadow:0 0 0 3px rgba(139,92,246,.18) }

/* ===== buttons / pills ===== */
button,.btn{
  background:
    radial-gradient(100% 100% at 60% 0%, rgba(255,255,255,.18), transparent 40%),
    linear-gradient(180deg, var(--violet), var(--violet-2));
  color:white; border:1px solid #4b2cad; border-radius:14px;
  padding:12px 16px; font-weight:800; font-size:14px; cursor:pointer;
  transition:transform .06s ease, filter .18s ease, box-shadow .18s ease;
  box-shadow:0 14px 40px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.14);
}
button:hover{ filter:brightness(1.06) } button:active{ transform:translateY(1px) }
.btn-ghost{
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
  border:1px solid #2f375a; color:#d7dbff; box-shadow:none;
}
button:disabled{ opacity:.6; cursor:not-allowed }

/* Outline gradient pill (matches “Generate Now” style) */
.btn-neo{
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  height:46px; padding:0 22px; border-radius:999px; font-weight:800; font-size:14px; color:#eef2ff;
  border:1.5px solid transparent; cursor:pointer;
  background:linear-gradient(#0b0f22,#0b0f22) padding-box,linear-gradient(90deg,#a78bfa 0%,#22d3ee 100%) border-box;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08);
}
.btn-neo:hover{ filter:brightness(1.06); box-shadow:0 8px 26px rgba(139,92,246,.25), inset 0 1px 0 rgba(255,255,255,.12) }
.btn-neo:active{ transform:translateY(1px) }
.btn-neo:disabled{ opacity:.6; cursor:not-allowed }

/* pills */
.pill{ display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03)); border:1px solid #2f375a; color:#c7ceed; font-size:12px; font-weight:700 }
.badge{ font-size:12px;padding:7px 12px;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border:1px solid #2f375a; color:#b8c0d9 }

/* ===== misc ===== */
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.hint{font-size:12px;color:var(--muted)}
.out{white-space:pre-wrap;background:linear-gradient(180deg,#090d1a,#0a0e1d);border:1px solid #2a3354;padding:14px;border-radius:14px;font-size:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,.02)}
.imgwrap{display:flex;align-items:center;justify-content:center;min-height:380px;background:linear-gradient(180deg,#0b0f22,#0a0e1e);border:1px dashed #2a3354;border-radius:16px;overflow:hidden}
.footer{margin-top:18px;font-size:12px;color:var(--muted)}

/* subtle site footer */
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
.spinner{display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.25);border-top-color:#a78bfa;animation:spin .9s linear infinite;vertical-align:-3px;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
`;
