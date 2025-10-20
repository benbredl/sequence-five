export const VIEWER_CSS_BOOTSTRAP = `
(function(){
  if(document.getElementById('viewer-style')) return;
  var css = ""
    + ".viewer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;animation:vbIn .18s ease forwards}"
    + "@keyframes vbIn{to{opacity:1}}"
    + ".viewer-wrap{position:relative;display:inline-block;max-width:92vw;max-height:92vh}"
    + ".viewer-img{max-width:92vw;max-height:92vh;border-radius:18px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);transition:filter .18s ease;display:block}"
    + ".viewer-backdrop.blurred .viewer-img{filter:blur(10px) brightness(.65)}"
    + ".viewer-bottombar{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;align-items:center}"
    + ".viewer-actions{display:flex;gap:6px;align-items:center}"
    + ".icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:transparent;padding:0;cursor:pointer;transition:transform .06s ease, filter .18s ease;opacity:.95;color:#fff}"
    + ".icon-btn[disabled]{opacity:.5;cursor:not-allowed}"
    + ".icon-btn:hover{filter:brightness(1.08)}"
    + ".icon-btn:active{transform:translateY(1px)}"
    + ".icon-btn svg{width:16px;height:16px;display:block}"
    + ".gal-overlay{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 100%);display:flex;align-items:center;justify-content:space-between;gap:6px;opacity:0;transform:translateY(8px);transition:opacity .22s ease, transform .22s ease;z-index:3;pointer-events:auto}"
    + ".card-gal:hover .gal-overlay{opacity:1;transform:translateY(0)}"
    + ".gal-meta{font-size:12px;color:#e6e9ff;display:flex;align-items:center;gap:8px}"
    + ".gal-actions{display:flex;gap:6px;align-items:center}"
    + ".gal-actions .icon-btn{color:#e6e9ff}"
    + ".type-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:3px 7px;font-size:11px;font-weight:800;letter-spacing:.2px}";
  var st=document.createElement('style'); st.id='viewer-style'; st.appendChild(document.createTextNode(css)); document.head.appendChild(st);
})();`;
