(() => {
  if (window.NBViewer) return;

  // ----- Icons -----
  const SVG_DOWNLOAD =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>";
  const SVG_ADD =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><line x1='12' y1='8' x2='12' y2='16'/><line x1='8' y1='12' x2='16' y2='12'/></svg>";
  const SVG_DELETE =
    "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'/><path d='M10 11v6'/><path d='M14 11v6'/></svg>";

  // ----- Styles -----
  function injectStyle() {
    if (document.getElementById("viewer-style")) return;
    const css =
      /* Backdrop & wrap */
      ".viewer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;animation:vbIn .18s ease forwards}" +
      "@keyframes vbIn{to{opacity:1}}" +
      ".viewer-wrap{position:relative;display:inline-block;max-width:92vw;max-height:92vh}" +
      /* Image fills the *fixed* wrap size we compute upfront (prevents layout shift) */
      ".viewer-img{width:100%;height:100%;object-fit:contain;border-radius:18px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);transition:filter .18s ease;display:block}" +
      ".viewer-img.blur-up{filter:blur(14px);transform:translateZ(0)}" +
      ".viewer-img.is-sharp{filter:none}" +
      ".viewer-backdrop.blurred .viewer-img{filter:blur(10px) brightness(.65)}" +

      /* Fullscreen bottom bars (now hidden until hi-res ready) */
      ".viewer-bottombar{position:absolute;right:16px;bottom:12px;display:flex;gap:4px;align-items:center;z-index:3;opacity:0;pointer-events:none;transition:opacity .20s ease}" +
      ".viewer-infobar{position:absolute;left:0;right:0;bottom:0;padding:10px 18px;padding-left:calc(18px + env(safe-area-inset-left));padding-right:calc(18px + env(safe-area-inset-right));display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:2;background:linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 100%);opacity:0;pointer-events:none;transition:opacity .20s ease}" +

      /* When hi-res has loaded, fade HUD in */
      ".viewer-wrap.hi-ready .viewer-bottombar, .viewer-wrap.hi-ready .viewer-infobar{opacity:1;pointer-events:auto}" +

      ".viewer-actions{display:flex;gap:4px;align-items:center}" +
      ".icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:none;outline:none;background:transparent;padding:0;margin:0;cursor:pointer;transition:transform .06s ease, filter .18s ease;opacity:.95;color:#fff;box-shadow:none}" +
      ".icon-btn[disabled]{opacity:.5;cursor:not-allowed}" +
      ".icon-btn:hover{filter:brightness(1.08)}" +
      ".icon-btn:active{transform:translateY(1px)}" +
      ".icon-btn svg{width:16px;height:16px;display:block}" +

      /* Infobar content */
      ".viewer-info-left{display:flex;align-items:center;gap:10px;font-size:12px;color:#e6e9ff;opacity:.95}" +
      ".viewer-ts{font-size:11px;color:#e6e9ff;opacity:.95}" +
      ".viewer-res{font-size:11px;color:#e6e9ff;opacity:.9}" +
      ".viewer-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid rgba(255,255,255,.8);background:transparent;color:#ffffff;padding:2px 8px;font-size:11px;font-weight:400;letter-spacing:.2px;text-transform:none;opacity:.95}" +

      /* Grid overlay (unchanged) */
      ".gal-overlay{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 70%, rgba(0,0,0,.85) 100%);pointer-events:none;opacity:0;transform:translateY(8px);transition:opacity .12s ease, transform .12s ease}" +
      ".gal-bottombar{position:absolute;left:12px;right:12px;bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;pointer-events:auto}" +
      ".gal-meta{display:flex;align-items:center;gap:8px}" +
      ".gal-actions{display:flex;align-items:center;gap:4px}" +
      ".gal-ts{font-size:11px;color:#e6e9ff;opacity:.92}" +

      /* --- Nice confirm modal --- */
      ".nbv-confirm-back{position:fixed;inset:0;background:rgba(6,8,18,.62);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10003}" +
      ".nbv-confirm{width:min(520px,92vw);background:rgba(18,22,38,.82);border:1px solid rgba(71,80,124,.8);border-radius:16px;box-shadow:0 24px 80px rgba(2,6,23,.65), inset 0 1px 0 rgba(255,255,255,.06);padding:16px;color:#e6e9ff}" +
      ".nbv-confirm h3{margin:0 0 8px 0;font-size:18px}" +
      ".nbv-confirm p{margin:0 0 12px 0;color:#c7ceed;font-size:13px;line-height:1.4}" +
      ".nbv-confirm .row{display:flex;gap:8px;justify-content:flex-end}" +
      ".nbv-btn{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}" +
      ".nbv-btn.danger{border-color:rgba(255,96,96,.35);background:linear-gradient(180deg,rgba(255,80,80,.14),rgba(255,80,80,.06));color:#ffb0b0}";
    const st = document.createElement("style");
    st.id = "viewer-style";
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  injectStyle();

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

  function formatTsForFilename(d) {
    const x = d instanceof Date ? d : new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    const hh = String(x.getHours()).padStart(2, "0");
    const mm = String(x.getMinutes()).padStart(2, "0");
    const ss = String(x.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}_${hh}${mm}${ss}`;
  }

  function computeFitSize(aspect, maxW, maxH) {
    if (!aspect || !isFinite(aspect) || aspect <= 0) return null;
    const wByH = maxH * aspect;
    if (wByH <= maxW) {
      return { width: Math.floor(wByH), height: Math.floor(maxH) };
    } else {
      const hByW = maxW / aspect;
      return { width: Math.floor(maxW), height: Math.floor(hByW) };
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
      a.download = name || "image.jpg";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(u);
        a.remove();
      }, 180);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", name || "image.jpg");
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  // Nice confirm modal (replaces window.confirm)
  function niceConfirm({ title = "Are you sure?", message = "", confirmText = "Delete", cancelText = "Cancel", danger = true } = {}) {
    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "nbv-confirm-back";
      const sheet = document.createElement("div");
      sheet.className = "nbv-confirm";
      sheet.innerHTML =
        `<h3>${title}</h3>` +
        `<p>${message}</p>` +
        `<div class="row">` +
        `<button class="nbv-btn">${cancelText}</button>` +
        `<button class="nbv-btn ${danger ? "danger" : ""}">${confirmText}</button>` +
        `</div>`;
      back.appendChild(sheet);
      document.body.appendChild(back);

      const [btnCancel, btnOk] = sheet.querySelectorAll(".nbv-btn");

      function close(val) {
        if (back.parentNode) back.parentNode.removeChild(back);
        resolve(val);
      }
      back.addEventListener("click", (e) => { if (e.target === back) close(false); });
      btnCancel.addEventListener("click", () => close(false));
      btnOk.addEventListener("click", () => close(true));
    });
  }

  // State/Type label formatter (prefer state, fallback to type)
  function stateToLabel(raw) {
    const s = String(raw || "").toLowerCase().trim();
    if (!s) return "";
    if (s === "base" || s === "base-image" || s === "base image") return "base image";
    if (s === "upscaled") return "upscaled";
    if (s === "video" || s === "i2v") return "video";
    return s;
  }

  // ----- Storyboard picker (unchanged) -----
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

  // ----- Fullscreen viewer (blur-up + fixed sizing) -----
  /**
   * open(urlLike, {
   *   imageId?, createdAt?,
   *   state?, type?,
   *   lowSrc?: string,
   *   aspect?: number,
   *   onDeleted?: Function
   * })
   */
  function open(urlLike, opts) {
    injectStyle();
    const url = normalizeUrl(urlLike);
    if (!url) return;

    opts = opts || {};
    const lowSrc = typeof opts.lowSrc === "string" ? opts.lowSrc : null;
    const knownAspect = Number(opts.aspect || 0) > 0 ? Number(opts.aspect) : null;

    const back = document.createElement("div");
    back.className = "viewer-backdrop";

    const wrap = document.createElement("div");
    wrap.className = "viewer-wrap";

    // Size the wrap *before* we show the image to avoid any jump.
    const maxW = Math.floor(window.innerWidth * 0.92);
    const maxH = Math.floor(window.innerHeight * 0.92);
    if (knownAspect) {
      const sz = computeFitSize(knownAspect, maxW, maxH);
      if (sz) {
        wrap.style.width = sz.width + "px";
        wrap.style.height = sz.height + "px";
      }
    }

    const img = document.createElement("img");
    img.className = "viewer-img";
    img.alt = "preview";
    img.decoding = "async";

    // Start with the low-res (if provided), blurred
    if (lowSrc) {
      img.src = lowSrc;
      img.classList.add("blur-up");
    } else {
      img.src = url;
    }

    // --- Infobar (timestamp, resolution, state pill) ---
    const infobar = document.createElement("div");
    infobar.className = "viewer-infobar";

    const infoLeft = document.createElement("div");
    infoLeft.className = "viewer-info-left";

    const ts = document.createElement("span");
    ts.className = "viewer-ts";
    if (opts.createdAt) ts.textContent = formatTimestamp(opts.createdAt);

    const res = document.createElement("span");
    res.className = "viewer-res";
    res.textContent = "";

    const pill = document.createElement("span");
    pill.className = "viewer-pill";
    const rawState = (opts.state != null ? opts.state : opts.type);
    const stateLabel = stateToLabel(rawState) || "";
    if (stateLabel) pill.textContent = stateLabel;

    if (ts.textContent) infoLeft.appendChild(ts);
    infoLeft.appendChild(res);
    if (stateLabel) infoLeft.appendChild(pill);
    infobar.appendChild(infoLeft);

    // --- Bottom-right actions bar ---
    const bottombar = document.createElement("div");
    bottombar.className = "viewer-bottombar";

    const actions = document.createElement("div");
    actions.className = "viewer-actions";

    const bDown = document.createElement("button");
    bDown.className = "icon-btn";
    bDown.title = "Download";
    bDown.innerHTML = SVG_DOWNLOAD;
    bDown.onclick = (e) => {
      e.stopPropagation();
      const created = opts.createdAt ? new Date(opts.createdAt) : new Date();
      const fname = `GeneratedImage_${formatTsForFilename(created)}.jpg`;
      forceDownload(url, fname); // always hi-res
    };

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
        const ok = await niceConfirm({
          title: "Delete image",
          message: "Delete this image everywhere? This cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          danger: true
        });
        if (!ok) return;
        bDel.disabled = true;
        try {
          const r = await fetch("/api/image/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: String(opts.imageId) }),
          });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "Failed");
          if (typeof opts.onDeleted === "function") opts.onDeleted(); // <-- inform grid to remove
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

    // Hi-res reveal
    const hi = new Image();
    hi.decoding = "async";
    hi.src = url;

    const revealHi = () => {
      if (!knownAspect && hi.naturalWidth && hi.naturalHeight) {
        const aspect = hi.naturalWidth / hi.naturalHeight;
        const sz = computeFitSize(aspect, maxW, maxH);
        if (sz) {
          wrap.style.width = sz.width + "px";
          wrap.style.height = sz.height + "px";
        }
      }
      if (img.src !== url) img.src = url;
      img.classList.remove("blur-up");
      img.classList.add("is-sharp");

      if (hi.naturalWidth && hi.naturalHeight) {
        res.textContent = `${hi.naturalWidth}×${hi.naturalHeight}`;
      }
      if (!opts.createdAt) ts.textContent = formatTimestamp(new Date());
      wrap.classList.add("hi-ready"); // HUD fade-in
    };

    const setResFromHi = () => {
      if (hi.naturalWidth && hi.naturalHeight) {
        res.textContent = `${hi.naturalWidth}×${hi.naturalHeight}`;
      }
    };

    if (hi.decode) {
      hi.decode()
        .then(() => { setResFromHi(); revealHi(); })
        .catch(() => hi.addEventListener("load", () => { setResFromHi(); revealHi(); }, { once: true }));
    } else {
      hi.addEventListener("load", () => { setResFromHi(); revealHi(); }, { once: true });
    }

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

  // ----- Card hover overlay -----
  function attachHoverOverlay(cardEl, imgUrlLike, item, onDeleted) {
    injectStyle();
    const imgUrl = normalizeUrl(imgUrlLike);

    const cs = getComputedStyle(cardEl);
    if (cs.position === "static" || !cs.position) cardEl.style.position = "relative";
    if (cs.overflow !== "hidden") cardEl.style.overflow = "hidden";

    const overlay = document.createElement("div");
    overlay.className = "gal-overlay";

    const bottom = document.createElement("div");
    bottom.className = "gal-bottombar";

    const meta = document.createElement("div");
    meta.className = "gal-meta";
    const dt = document.createElement("span");
    dt.className = "gal-ts";
    dt.textContent = item?.createdAt ? formatTimestamp(item.createdAt) : "";
    meta.appendChild(dt);

    const actions = document.createElement("div");
    actions.className = "gal-actions";

    const aDown = document.createElement("button");
    aDown.className = "icon-btn";
    aDown.innerHTML = SVG_DOWNLOAD;
    aDown.title = "Download";
    aDown.onclick = (e) => {
      e.stopPropagation();
      const hiUrl = (item && (item.fullUrl || item.archiveUrl)) || imgUrl; // prefer hi-res
      const created = item?.createdAt ? new Date(item.createdAt) : new Date();
      const fname = `GeneratedImage_${formatTsForFilename(created)}.jpg`;
      if (hiUrl) forceDownload(hiUrl, fname);
    };

    const aAdd = document.createElement("button");
    aAdd.className = "icon-btn";
    aAdd.innerHTML = SVG_ADD;
    aAdd.title = "Add to Storyboard";
    aAdd.onclick = (e) => { e.stopPropagation(); if (item && item.id) openPicker(item.id); };

    const aDel = document.createElement("button");
    aDel.className = "icon-btn";
    aDel.innerHTML = SVG_DELETE;
    aDel.title = "Delete";
    aDel.onclick = async (e) => {
      e.stopPropagation();
      if (!item || !item.id) return;
      const ok = await niceConfirm({
        title: "Delete image",
        message: "Delete this image everywhere? This cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        danger: true
      });
      if (!ok) return;
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

    bottom.appendChild(meta);
    bottom.appendChild(actions);
    overlay.appendChild(bottom);

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
    openViewerWithActions: open,
    openPicker,
    attachHoverOverlay,
  };
})();
