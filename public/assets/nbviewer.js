// public/assets/nbviewer.js
(() => {
  if (window.NBViewer) return;

  // ----- Icons -----
  const SVG_DOWNLOAD =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>";
  const SVG_ADD =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><line x1='12' y1='8' x2='12' y2='16'/><line x1='8' y1='12' x2='16' y2='12'/></svg>";
  const SVG_DELETE =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/><path d='M10 11v6'/><path d='M14 11v6'/></svg>";

  // ----- Styles (viewer + infobar) -----
  function injectStyle() {
    if (document.getElementById("viewer-style")) return;
    const css =
      ".viewer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;animation:vbIn .18s ease forwards}" +
      "@keyframes vbIn{to{opacity:1}}" +
      ".viewer-wrap{position:relative;display:inline-block;max-width:92vw;max-height:92vh}" +
      ".viewer-img{max-width:92vw;max-height:92vh;border-radius:18px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);transition:filter .18s ease;display:block}" +
      ".viewer-backdrop.blurred .viewer-img{filter:blur(10px) brightness(.65)}" +
      ".viewer-bottombar{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;align-items:center;z-index:3}" +
      ".viewer-actions{display:flex;gap:6px;align-items:center}" +
      ".icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;background:transparent;padding:0;cursor:pointer;transition:transform .06s ease, filter .18s ease;opacity:.95;color:#fff}" +
      ".icon-btn[disabled]{opacity:.5;cursor:not-allowed}" +
      ".icon-btn:hover{filter:brightness(1.08)}" +
      ".icon-btn:active{transform:translateY(1px)}" +
      ".icon-btn svg{width:16px;height:16px;display:block}" +

      /* Infobar over image (bottom, subtle gradient, wide) */
      ".viewer-infobar{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:2;" +
        "background:linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 100%)}" +
      ".viewer-info-left{display:flex;align-items:center;gap:10px;font-size:12px;color:#e6e9ff;opacity:.95}" +
      ".viewer-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:3px 7px;font-size:11px;font-weight:800;letter-spacing:.2px}" +
      ".viewer-ts{font-size:12px;color:#e6e9ff;opacity:.95}" +
      ".viewer-res{font-size:12px;color:#cbd2f0;opacity:.9}" ;
    const st = document.createElement("style");
    st.id = "viewer-style";
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  // ----- Helpers -----
  function normalizeUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input && typeof input === "object") {
      if (typeof input.url === "string") return input.url;
      if (typeof input.href === "string") return input.href;
    }
    console.error("[NBViewer] Expected a string URL, got:", input);
    return null;
  }

  function formatTimestamp(d) {
    try {
      const date = d instanceof Date ? d : new Date(d);
      const day = date.getDate();
      const monthName = date.toLocaleString(undefined, { month: "long" });
      const suffix = (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return "st";
        if (n % 10 === 2 && n % 100 !== 12) return "nd";
        if (n % 10 === 3 && n % 100 !== 13) return "rd";
        return "th";
      };
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      return `${monthName} ${day}${suffix(day)}, ${hh}:${mm}`;
    } catch {
      return "";
    }
  }

  async function forceDownload(url, name) {
    try {
      const r = await fetch(url, { mode: "cors" });
      if (!r.ok) throw 0;
      const b = await r.blob();
      const a = document.createElement("a");
      const u = URL.createObjectURL(b);
      a.href = u;
      a.download = name || "image.png";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(u);
        a.remove();
      }, 180);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "image");
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  // ----- Storyboard picker (with background blur) -----
  function openPicker(imageId, backdropEl) {
    const back = document.createElement("div");
    back.style.cssText =
      "position:fixed;inset:0;background:rgba(6,8,18,.62);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10002";
    const sheet = document.createElement("div");
    sheet.style.cssText =
      "width:min(560px,92vw);background:rgba(18,22,38,.82);backdrop-filter: blur(12px) saturate(120%);border:1px solid rgba(71,80,124,.8);border-radius:18px;box-shadow:0 24px 80px rgba(2,6,23,.65), inset 0 1px 0 rgba(255,255,255,.06);padding:16px;color:#e6e9ff";
    sheet.innerHTML =
      "<h3 style='margin:0 0 10px 0;font-size:18px;font-weight:700'>Add to Storyboard</h3>" +
      "<div class='hint' style='font-size:12px;color:#a1a8be'>Choose a storyboard to add this image to.</div>" +
      "<div id='nbv-list' style='margin-top:10px;max-height:320px;overflow:auto;border:1px solid #2f375a;border-radius:12px'><div class='hint' style='padding:12px'><span class='spinner'></span> Loading…</div></div>" +
      "<div style='margin-top:12px;display:flex;justify-content:flex-end'><button id='nbv-close' style='padding:7px 12px;border:1px solid #2f375a;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;font-weight:700'>Close</button></div>";
    back.appendChild(sheet);
    document.body.appendChild(back);

    if (backdropEl) backdropEl.classList.add("blurred");

    function close() {
      if (back.parentNode) back.parentNode.removeChild(back);
      if (backdropEl) backdropEl.classList.remove("blurred");
    }
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    sheet.querySelector("#nbv-close").addEventListener("click", close);

    fetch("/api/storyboards")
      .then((r) => r.json().then((j) => ({ ok: r.ok, body: j })))
      .then((x) => {
        const list = sheet.querySelector("#nbv-list");
        if (!x.ok) { list.innerHTML = "<div class='hint' style='padding:12px'>Failed to load</div>"; return; }
        const arr = x.body.storyboards || [];
        if (!arr.length) { list.innerHTML = "<div class='hint' style='padding:12px'>You have no storyboards yet.</div>"; return; }
        list.innerHTML = "";
        arr.forEach((sb) => {
          const row = document.createElement("div");
          row.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #2a3354";
          row.innerHTML =
            "<div><div style='font-weight:700'>" + (sb.title || "") + "</div>" +
            "<div class='hint' style='font-size:12px;color:#a1a8be'>" + (sb.description || "") + "</div></div>";
          const add = document.createElement("button");
          add.style.cssText =
            "padding:7px 12px;border:1px solid #2f375a;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;font-weight:700";
          add.textContent = "Add";
          add.onclick = () => {
            add.disabled = true; add.textContent = "Adding…";
            fetch("/api/storyboard/add", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storyboardId: sb.id, imageId: String(imageId) }),
            })
              .then((r) => r.json().then((j) => ({ ok: r.ok, body: j })))
              .then((y) => { if (!y.ok) throw new Error(y.body.error || "Failed"); add.textContent = "Added"; setTimeout(close, 420); })
              .catch((e) => { alert(e.message || e); add.disabled = false; add.textContent = "Add"; });
          };
          row.appendChild(add);
          list.appendChild(row);
        });
      })
      .catch(() => {
        sheet.querySelector("#nbv-list").innerHTML =
          "<div class='hint' style='padding:12px'>Error loading</div>";
      });
  }

  // ----- Fullscreen viewer with infobar -----
  function open(urlLike, opts) {
    injectStyle();
    const url = normalizeUrl(urlLike);
    if (!url) return;

    opts = opts || {};
    const back = document.createElement("div");
    back.className = "viewer-backdrop";

    const wrap = document.createElement("div");
    wrap.className = "viewer-wrap";

    const img = document.createElement("img");
    img.className = "viewer-img";
    img.alt = "preview";
    img.decoding = "async";
    img.src = url;

    // --- Infobar (timestamp, resolution, type) ---
    const infobar = document.createElement("div");
    infobar.className = "viewer-infobar";

    const infoLeft = document.createElement("div");
    infoLeft.className = "viewer-info-left";

    const ts = document.createElement("span");
    ts.className = "viewer-ts";
    if (opts.createdAt) ts.textContent = formatTimestamp(opts.createdAt);

    const res = document.createElement("span");
    res.className = "viewer-res";
    res.textContent = ""; // will be filled onload

    const pill = document.createElement("span");
    pill.className = "viewer-pill";
    pill.textContent = (opts.type || "").toLowerCase();

    infoLeft.appendChild(ts);
    infoLeft.appendChild(res);
    if (pill.textContent) infoLeft.appendChild(pill);

    infobar.appendChild(infoLeft);

    // --- Bottom-right actions bar (download / add / delete) ---
    const bottombar = document.createElement("div");
    bottombar.className = "viewer-bottombar";

    const actions = document.createElement("div");
    actions.className = "viewer-actions";

    const bDown = document.createElement("button");
    bDown.className = "icon-btn";
    bDown.title = "Download";
    bDown.innerHTML = SVG_DOWNLOAD;
    bDown.onclick = (e) => { e.stopPropagation(); forceDownload(url); };

    const bAdd = document.createElement("button");
    bAdd.className = "icon-btn";
    bAdd.title = opts.imageId ? "Add to Storyboard" : "Add to Storyboard (image not saved yet)";
    bAdd.innerHTML = SVG_ADD;
    if (opts.imageId) {
      bAdd.onclick = (e) => { e.stopPropagation(); openPicker(opts.imageId, back); };
    } else {
      bAdd.disabled = true;
    }

    const bDel = document.createElement("button");
    bDel.className = "icon-btn";
    bDel.title = opts.imageId ? "Delete" : "Delete (image not saved yet)";
    bDel.innerHTML = SVG_DELETE;
    if (opts.imageId) {
      bDel.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm("Delete this image everywhere? This cannot be undone.")) return;
        bDel.disabled = true;
        try {
          const r = await fetch("/api/image/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: String(opts.imageId) }),
          });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "Failed");
          if (typeof opts.onDeleted === "function") opts.onDeleted();
          close();
        } catch (err) {
          alert(err.message || err);
          bDel.disabled = false;
        }
      };
    } else {
      bDel.disabled = true;
    }

    actions.appendChild(bDown);
    actions.appendChild(bAdd);
    actions.appendChild(bDel);
    bottombar.appendChild(actions);

    wrap.appendChild(img);
    wrap.appendChild(infobar);
    wrap.appendChild(bottombar);
    back.appendChild(wrap);
    document.body.appendChild(back);

    // Fill resolution once the image loads
    img.addEventListener("load", () => {
      if (img.naturalWidth && img.naturalHeight) {
        res.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
      }
      // If no createdAt provided, at least show "now"
      if (!opts.createdAt) ts.textContent = formatTimestamp(new Date());
    }, { once: true });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function close() {
      if (back.parentNode) {
        back.parentNode.removeChild(back);
        document.body.style.overflow = prevOverflow;
        document.removeEventListener("keydown", onKey);
      }
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    document.addEventListener("keydown", onKey);
  }

  // ----- Card hover overlay (uses original classes so it inherits BASE_STYLES) -----
  function attachHoverOverlay(cardEl, imgUrlLike, item, onDeleted) {
    const imgUrl = normalizeUrl(imgUrlLike);
    const overlay = document.createElement("div");
    overlay.className = "gal-overlay";

    const meta = document.createElement("div");
    meta.className = "gal-meta";
    const dt = document.createElement("span");
    dt.textContent = item?.createdAt ? formatTimestamp(item.createdAt) : "";
    meta.appendChild(dt);

    const type = document.createElement("span");
    type.className = "type-pill";
    type.textContent = (item?.type || "").toLowerCase();
    type.style.textTransform = "none";
    meta.appendChild(type);

    const actions = document.createElement("div");
    actions.className = "gal-actions";

    const aDown = document.createElement("button");
    aDown.className = "icon-btn";
    aDown.innerHTML = SVG_DOWNLOAD;
    aDown.onclick = (e) => { e.stopPropagation(); if (imgUrl) forceDownload(imgUrl); };

    const aAdd = document.createElement("button");
    aAdd.className = "icon-btn";
    aAdd.innerHTML = SVG_ADD;
    aAdd.onclick = (e) => { e.stopPropagation(); if (item && item.id) openPicker(item.id); };

    const aDel = document.createElement("button");
    aDel.className = "icon-btn";
    aDel.innerHTML = SVG_DELETE;
    aDel.onclick = async (e) => {
      e.stopPropagation();
      if (!item || !item.id) return;
      if (!confirm("Delete this image everywhere?")) return;
      aDel.disabled = true;
      try {
        const r = await fetch("/api/image/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: item.id }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        if (typeof onDeleted === "function") onDeleted();
        if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
      } catch (err) {
        alert(err.message || err);
        aDel.disabled = false;
      }
    };

    actions.appendChild(aDown);
    actions.appendChild(aAdd);
    actions.appendChild(aDel);

    overlay.appendChild(meta);
    overlay.appendChild(actions);

    // Small enter/leave animation (matches original behavior)
    overlay.style.opacity = "0";
    overlay.style.transform = "translateY(8px)";
    cardEl.addEventListener("mouseenter", () => {
      overlay.style.opacity = "1";
      overlay.style.transform = "translateY(0)";
    });
    cardEl.addEventListener("mouseleave", () => {
      overlay.style.opacity = "0";
      overlay.style.transform = "translateY(8px)";
    });

    return overlay;
  }

  window.NBViewer = {
    open,
    openViewerWithActions: open, // alias for legacy calls
    openPicker,
    attachHoverOverlay,
  };
})();
