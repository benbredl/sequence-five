export const MODAL_CSS = `
.nb-modal-backdrop{position:fixed;inset:0;background:rgba(6,8,18,.58);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10002}
.nb-modal{width:min(560px,92vw);background:rgba(12,15,32,.62);backdrop-filter: blur(12px) saturate(120%);border:1px solid rgba(71,80,124,.8);border-radius:18px;box-shadow:0 24px 80px rgba(2,6,23,.65), inset 0 1px 0 rgba(255,255,255,.06);padding:16px}
.nb-modal h3{margin:0 0 10px 0;font-size:18px}
.nb-modal .hint{color:#a1a8be;font-size:12px}
.nb-list{margin-top:10px;max-height:320px;overflow:auto;border:1px solid #2f375a;border-radius:12px}
.nb-row{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #2a3354}
.nb-row:last-child{border-bottom:none}
.nb-pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}
.nb-close{margin-top:12px;display:flex;justify-content:flex-end}
`;
