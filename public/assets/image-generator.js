// public/assets/image-generator.js
// Generator page logic: 2-up grid, blur-up tiny->thumb swap, refined hover overlay,
// enhanced drop zone (hover/drag visuals + link cursor) and white-focus ring on the prompt.
// Overlay layout: top-right type-pill, bottom-left timestamp, bottom-right action buttons.
// Fixes: pass-through clicks on image (overlay pointer-events none; buttons stay interactive),
// and bottom-only gradient (no darkening at the top).

(function () {
  const $ = (id) => document.getElementById(id);

  const drop = $("drop");
  const fileInput = $("file");
  const dropInner = $("dropInner");
  const removeUpload = $("removeUpload");
  const uploadMeta = $("uploadMeta");

  const promptEl = $("prompt");
  const enhanceBtn = $("enhance");
  const generateBtn = $("generate");

  const resultsGrid = $("resultsGrid");
  const empty = $("empty");
  const inprogEl = $("inprog");
  const limitEl = $("limit");
  const showAllLink = $("showAll");

  const MAX_PARALLEL = Number((limitEl && limitEl.textContent) || "5") || 5;

  let inProgress = 0;
  let currentUpload = null;

  /* -------------------- Inject scoped styles (drop + prompt focus) -------------------- */
  (function injectLocalStyles() {
    const styleId = "ig-enhanced-styles";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      /* ===== Drop area states ===== */
      #${drop ? drop.id : "drop"} {
        transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .12s ease;
        will-change: background-color, border-color, box-shadow, transform;
      }
      #${drop ? drop.id : "drop"}:hover { cursor: pointer; }
      #${drop ? drop.id : "drop"}.is-hover:not(.has-upload) {
        background: radial-gradient(120% 120% at 50% 0%, var(--glass1) 0%, var(--glass2) 100%);
        border-color: color-mix(in oklab, var(--line-soft) 60%, white);
        box-shadow: 0 2px 12px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.04);
        transform: translateY(-1px);
      }
      #${drop ? drop.id : "drop"}.is-drag:not(.has-upload) {
        background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
        border-style: dashed;
        border-color: color-mix(in oklab, var(--brand, #7c8cff) 50%, white 20%);
        box-shadow: 0 0 0 3px rgba(124,140,255,.15), 0 8px 24px rgba(0,0,0,.20);
      }

      /* ===== Prompt input white-focus ring (matches drop hover look) ===== */
      #prompt, input#prompt, textarea#prompt {
        transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
      }
      #prompt:focus, #prompt:focus-visible,
      input#prompt:focus, input#prompt:focus-visible,
      textarea#prompt:focus, textarea#prompt:focus-visible {
        outline: none !important;
        border-color: color-mix(in oklab, var(--line-soft) 60%, white);
        box-shadow:
          0 2px 12px rgba(0,0,0,.10),
          inset 0 0 0 1px rgba(255,255,255,.04),
          0 0 0 3px rgba(255,255,255,.14);
        background: radial-gradient(120% 120% at 50% 0%, var(--glass1) 0%, var(--glass2) 100%);
      }

      /* Subtle helper for bottom-only gradient sizing on overlay via pseudo element (fallback is inline style) */
      .gal-overlay-bottom-gradient::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.40) 20%, rgba(0,0,0,0.00) 55%);
      }
    `;
    document.head.appendChild(s);
  })();

  /* -------------------- Utilities -------------------- */
  function setInProgress(n) {
    inProgress = Math.max(0, n);
    if (inprogEl) inprogEl.textContent = String(inProgress);
    if (generateBtn) generateBtn.disabled = inProgress >= MAX_PARALLEL;
  }

  function bytes(n) {
    if (n == null) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  function createEl(tag, cls) { const el = document.createElement(tag); if (cls) el.className = cls; return el; }

  function showEmptyIfNeeded() {
    const has = resultsGrid && resultsGrid.children.length > 0;
    if (empty) empty.style.display = has ? "none" : "block";
  }

  async function jfetch(url, opts) {
    const r = await fetch(url, opts);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
    return j;
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
    } catch { return ""; }
  }

  function inferTypeFromContext() {
    return currentUpload && currentUpload.dataUrl ? "I2I" : "T2I";
  }

  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  /* -------------------- Upload area -------------------- */
  async function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) { alert("Please choose an image file."); return; }
    const dataUrl = await readFileAsDataUrl(file);
    const dim = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });

    currentUpload = { dataUrl, name: file.name, size: file.size, type: file.type, width: dim.w, height: dim.h };

    drop.classList.add("has-upload");
    drop.classList.remove("is-drag");
    drop.classList.remove("is-hover");
    dropInner.innerHTML = "";
    const preview = document.createElement("img");
    preview.className = "preview";
    preview.alt = "Uploaded base image";
    preview.src = dataUrl;
    drop.appendChild(preview);

    uploadMeta.style.fontSize = "11px";
    uploadMeta.style.opacity = "0.85";
    uploadMeta.textContent = `${file.name} — ${bytes(file.size)} — ${dim.w}×${dim.h}`;
    removeUpload.style.display = "inline-flex";
  }

  function clearUpload() {
    currentUpload = null;
    uploadMeta.textContent = "";
    removeUpload.style.display = "none";
    drop.classList.remove("has-upload");
    drop.classList.remove("is-hover");
    drop.classList.remove("is-drag");
    const prev = drop.querySelector("img.preview");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    dropInner.innerHTML = "<div>Upload base image (optional)</div>";
  }

  // Hover interactions
  if (drop) {
    drop.addEventListener("mouseenter", () => drop.classList.add("is-hover"));
    drop.addEventListener("mouseleave", () => drop.classList.remove("is-hover"));

    drop.addEventListener("dragenter", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
    drop.addEventListener("dragleave", (e) => {
      if (!drop.contains(e.relatedTarget)) drop.classList.remove("is-drag");
    });
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("is-drag");
      const file = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) || null;
      if (file) handleFile(file);
    });

    drop.addEventListener("click", () => fileInput.click());
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
  }

  fileInput && fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (f) handleFile(f);
  });
  removeUpload && removeUpload.addEventListener("click", clearUpload);

  /* -------------------- Progressive images (tiny -> thumb) -------------------- */
  function createProgressiveImage({ tinyUrl, thumbUrl, alt = "" }, onSettled) {
    const img = document.createElement("img");
    img.decoding = "async";
    img.loading = "lazy";
    img.alt = alt;
    img.className = "blur-up";
    img.src = tinyUrl || thumbUrl;

    const settle = () => { img.classList.add("is-loaded"); if (typeof onSettled === "function") onSettled(); };

    if (tinyUrl && thumbUrl && thumbUrl !== tinyUrl) {
      const hi = new Image();
      hi.decoding = "async";
      hi.src = thumbUrl;
      const reveal = () => {
        if (img.src !== thumbUrl) img.src = thumbUrl;
        requestAnimationFrame(settle);
      };
      if (hi.decode) {
        hi.decode().then(reveal).catch(() => hi.addEventListener("load", reveal, { once: true }));
      } else {
        hi.addEventListener("load", reveal, { once: true });
      }
      hi.addEventListener("error", () => requestAnimationFrame(settle), { once: true });
    } else {
      if (img.complete) {
        requestAnimationFrame(settle);
      } else {
        img.addEventListener("load", settle, { once: true });
        img.addEventListener("error", settle, { once: true });
      }
    }
    return img;
  }

  /* -------------------- Overlay helpers -------------------- */
  function isStoryboardBtn(el) {
    if (!el) return false;
    const da = (el.getAttribute("data-action") || "").toLowerCase();
    const ar = (el.getAttribute("aria-label") || "").toLowerCase();
    const ti = (el.getAttribute("title") || "").toLowerCase();
    const tx = (el.textContent || "").toLowerCase().trim();
    return (
      da === "add-to-storyboard" ||
      da === "storyboard-add" ||
      ar.includes("add to storyboard") ||
      ti.includes("add to storyboard") ||
      tx === "add to storyboard"
    );
  }

  function isRemoveBtn(el) {
    if (!el) return false;
    const da = (el.getAttribute("data-action") || "").toLowerCase();
    const ar = (el.getAttribute("aria-label") || "").toLowerCase();
    const ti = (el.getAttribute("title") || "").toLowerCase();
    const tx = (el.textContent || "").toLowerCase().trim();
    return (
      da === "remove" ||
      da === "delete" ||
      ar.includes("remove") ||
      ar.includes("delete") ||
      ti.includes("remove") ||
      ti.includes("delete") ||
      tx === "remove" ||
      tx === "delete"
    );
  }

  function keepOnlyStoryboardAndRemove(actionsRoot) {
    if (!actionsRoot) return;

    const allControls = Array.from(actionsRoot.querySelectorAll("button, a"));

    const storyboard = allControls.find(isStoryboardBtn) || null;
    const remove = allControls.find(isRemoveBtn) || null;

    if (storyboard && remove) {
      allControls.forEach((el) => {
        if (el !== storyboard && el !== remove) {
          el.style.display = "none";
        } else {
          el.style.display = "inline-flex";
        }
      });

      storyboard.style.order = "0";
      remove.style.order = "1";

      actionsRoot.style.display = "flex";
      actionsRoot.style.gap = "6px";
      actionsRoot.style.alignItems = "center";
    } else {
      actionsRoot.style.display = "flex";
      actionsRoot.style.gap = "6px";
      actionsRoot.style.alignItems = "center";
    }
  }

  function makeActionsIconOnly(actionsRoot, opacity) {
    const btns = actionsRoot.querySelectorAll("button, a");
    actionsRoot.style.gap = "6px";
    actionsRoot.style.opacity = opacity;
    actionsRoot.style.flexShrink = "0";

    btns.forEach((btn) => {
      if (btn.style.display === "none") return;

      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.boxShadow = "none";
      btn.style.padding = "0";
      btn.style.width = "24px";
      btn.style.height = "24px";
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";

      const svg = btn.querySelector("svg");
      if (svg) {
        Array.from(btn.childNodes).forEach((n) => { if (n !== svg) btn.removeChild(n); });
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.style.pointerEvents = "none";
      } else {
        btn.style.fontSize = "12px";
        btn.style.lineHeight = "1";
        btn.style.color = "#fff";
        btn.style.opacity = opacity;
      }
    });
  }

  function ensureCornerContainers(overlayEl) {
    // Create absolute-positioned containers for the three corners we use
    const ensure = (cls, styles) => {
      let el = overlayEl.querySelector(`.${cls}`);
      if (!el) {
        el = document.createElement("div");
        el.className = cls;
        Object.assign(el.style, {
          position: "absolute",
          pointerEvents: "none",
          zIndex: "3",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          ...styles,
        });
        overlayEl.appendChild(el);
      } else {
        Object.assign(el.style, styles);
      }
      return el;
    };

    const topRight = ensure("gal-top-right", { top: "8px", right: "8px" });
    const bottomLeft = ensure("gal-bottom-left", { bottom: "8px", left: "12px" });
    const bottomRight = ensure("gal-bottom-right", { bottom: "6px", right: "8px" });

    return { topRight, bottomLeft, bottomRight };
  }

  function tweakOverlay(overlayEl) {
    if (!overlayEl) return;

    // Let clicks go THROUGH the overlay so image remains clickable.
    overlayEl.style.pointerEvents = "none";

    // Absolute positioning and size
    overlayEl.style.position = "absolute";
    overlayEl.style.inset = "0";
    overlayEl.style.zIndex = "2";

    // Keep only a bottom gradient; top stays clear.
    // Use both inline background and helper class (for safety across themes).
    overlayEl.style.background = "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.40) 20%, rgba(0,0,0,0.00) 55%)";
    overlayEl.classList.add("gal-overlay-bottom-gradient");

    const infoOpacity = "0.72";
    const { topRight, bottomLeft, bottomRight } = ensureCornerContainers(overlayEl);

    // Meta row (timestamp + type pill)
    const metaRow = overlayEl.querySelector(".gal-meta");
    if (metaRow) {
      // Timestamp -> bottom-left
      const timestampEl = metaRow.querySelector("span");
      if (timestampEl) {
        timestampEl.style.whiteSpace = "nowrap";
        timestampEl.style.fontWeight = "400";
        timestampEl.style.color = "#fff";
        timestampEl.style.fontSize = "10px"; // a bit smaller
        timestampEl.style.opacity = infoOpacity;
        bottomLeft.appendChild(timestampEl);
      }

      // Type pill -> top-right
      const pill = metaRow.querySelector(".type-pill");
      if (pill) {
        const pills = metaRow.querySelectorAll(".type-pill");
        if (pills.length > 1) for (let i = 1; i < pills.length; i++) pills[i].remove();

        pill.style.background = "transparent";
        pill.style.border = "1px solid rgba(255,255,255,0.4)";
        pill.style.borderRadius = "999px";
        pill.style.padding = "2px 8px";
        pill.style.margin = "0";
        pill.style.whiteSpace = "nowrap";
        pill.style.fontWeight = "400";
        pill.style.color = "#fff";
        pill.style.fontSize = "11px";
        pill.style.opacity = infoOpacity;

        topRight.appendChild(pill);
      }

      // Hide original flow container
      metaRow.style.display = "none";
    }

    // Actions -> bottom-right (buttons must stay interactive)
    const actions = overlayEl.querySelector(".gal-actions");
    if (actions) {
      keepOnlyStoryboardAndRemove(actions);
      makeActionsIconOnly(actions, infoOpacity);
      actions.style.pointerEvents = "auto"; // keep buttons clickable!
      bottomRight.appendChild(actions);
    }
  }

  /* -------------------- Card renderer -------------------- */
  function cardTile({ id, tinyUrl, thumbUrl, url, createdAt, type }, onDeleted) {
    const card = createEl("div", "card-gal");
    card.style.position = "relative";

    // Click-through link for fullscreen
    const link = createEl("a");
    link.href = "javascript:void(0)";
    link.style.display = "block";
    link.style.position = "relative";
    link.style.borderRadius = "16px";
    link.style.overflow = "hidden";
    link.style.border = "1px solid var(--line-soft)";

    const img = createProgressiveImage(
      { tinyUrl, thumbUrl: thumbUrl || url, alt: "Generated image" }
    );
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    link.appendChild(img);
    card.appendChild(link);

    if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
      const overlay = NBViewer.attachHoverOverlay(
        card,
        thumbUrl || url || "",
        { id, createdAt, type },
        onDeleted
      );

      try {
        const metaRow = overlay && overlay.querySelector(".gal-meta");
        if (metaRow) {
          const pills = metaRow.querySelectorAll(".type-pill");
          if (pills.length > 1) for (let i = 1; i < pills.length; i++) pills[i].remove();
        }
      } catch {}

      tweakOverlay(overlay);

      // Ensure overlay sits above the image but allows clicks to pass except on actions
      card.appendChild(overlay);
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (!window.NBViewer || !NBViewer.open) return;
      NBViewer.open(url || thumbUrl, { imageId: id, createdAt, type });
    });

    return card;
  }

  /* -------------------- Preload last 5 images into results -------------------- */
  async function preloadLastFive() {
    try {
      const r = await fetch("/api/archive?limit=5");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      const items = Array.isArray(j.items) ? j.items : [];
      if (!items.length) return;

      const frag = document.createDocumentFragment();
      for (const it of items) {
        const card = cardTile({
          id: it.id || null,
          tinyUrl: it.tinyUrl || null,
          thumbUrl: it.thumbUrl || null,
          url: it.url || null,
          createdAt: it.createdAt || null,
          type: it.type || null,
        });
        frag.appendChild(card);
      }
      resultsGrid.appendChild(frag);
      showEmptyIfNeeded();
    } catch (e) {
      console.error("[preloadLastFive]", e);
    }
  }

  /* -------------------- Generate flow -------------------- */
  function skeletonTile() {
    const card = createEl("div", "card-gal");
    card.style.position = "relative";

    const box = createEl("div");
    box.style.position = "relative";
    box.style.width = "100%";
    box.style.aspectRatio = "16 / 9";
    box.style.borderRadius = "16px";
    box.style.overflow = "hidden";
    box.style.border = "1px solid var(--line-soft)";
    box.style.background = "linear-gradient(180deg, var(--glass1), var(--glass2))";

    const sk = createEl("div", "skeleton");
    const sp = createEl("div", "spinner-lg");
    sk.appendChild(sp);
    box.appendChild(sk);
    card.appendChild(box);

    return { card, box };
  }

  function addHoverOverlay(containerEl, imgUrl, meta) {
    if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
      const overlay = NBViewer.attachHoverOverlay(
        containerEl,
        imgUrl,
        {
          id: meta.id,
          createdAt: meta.createdAt ? meta.createdAt.toISOString() : new Date().toISOString(),
          type: meta.type || ""
        },
        meta.onDeleted
      );

      const metaRow = overlay.querySelector(".gal-meta");
      if (metaRow) {
        const firstSpan = metaRow.querySelector("span");
        if (firstSpan) firstSpan.textContent = formatTimestamp(meta.createdAt || new Date());
        const pills = metaRow.querySelectorAll(".type-pill");
        if (pills.length > 1) for (let i = 1; i < pills.length; i++) pills[i].remove();
      }

      tweakOverlay(overlay);

      containerEl.appendChild(overlay);
    }
  }

  enhanceBtn && enhanceBtn.addEventListener("click", async () => {
    const text = promptEl.value.trim();
    if (!text) { alert("Enter a prompt first."); return; }
    enhanceBtn.disabled = true;
    try {
      const j = await jfetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, systemPrompt: (window.DEFAULT_SYSTEM_PROMPT || "") })
      });
      promptEl.value = String(j.enhancedPrompt || text);
    } catch (e) { alert(e.message || e); }
    finally { enhanceBtn.disabled = false; }
  });

  generateBtn && generateBtn.addEventListener("click", async () => {
    const text = promptEl.value.trim();
    if (!text) { alert("Please write a prompt."); return; }
    if (inProgress >= MAX_PARALLEL) { alert(`Please wait — max ${MAX_PARALLEL} generations in progress.`); return; }

    const { card, box } = skeletonTile();
    resultsGrid.prepend(card);
    showEmptyIfNeeded();

    setInProgress(inProgress + 1);

    try {
      const body = { prompt: text, systemPrompt: (window.DEFAULT_SYSTEM_PROMPT || "") };
      const generationType = inferTypeFromContext();
      if (currentUpload && currentUpload.dataUrl) { body.image = { dataUrl: currentUpload.dataUrl }; }

      const j = await jfetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const base64 = String(j.imageBase64 || "");
      const archiveUrl = String(j.archiveUrl || "");
      const id = j.id || null;

      const blob = await (async () => {
        try { return await (await fetch(`data:${j.mimeType || "image/png"};base64,${base64}`)).blob(); }
        catch { return null; }
      })();
      const objUrl = blob ? URL.createObjectURL(blob) : `data:${j.mimeType || "image/png"};base64,${base64}`;

      box.innerHTML = "";
      const img = new Image();
      img.alt = "Generated image";
      img.decoding = "async";
      img.loading = "eager";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.src = objUrl;
      box.appendChild(img);

      addHoverOverlay(card, objUrl, {
        id,
        archiveUrl,
        type: generationType,
        createdAt: new Date(),
        onDeleted: () => { if (card && card.parentNode) card.parentNode.removeChild(card); showEmptyIfNeeded(); }
      });

      card.style.cursor = "zoom-in";
      card.addEventListener("click", () => {
        const full = archiveUrl || objUrl;
        if (window.NBViewer && typeof NBViewer.open === "function") {
          NBViewer.open(full, {
            imageId: id || null,
            createdAt: new Date(),
            type: generationType
          });
        } else {
          window.open(full, "_blank", "noopener,noreferrer");
        }
      });

      setTimeout(() => { if (blob) URL.revokeObjectURL(objUrl); }, 30000);
    } catch (e) {
      box.innerHTML = `<div class="hint" style="font-size:12px">${(e.message || e)}</div>`;
    } finally {
      setInProgress(inProgress - 1);
      generateBtn.disabled = inProgress >= MAX_PARALLEL;
    }
  });

  // Initial state
  showEmptyIfNeeded();
  preloadLastFive();

  if (showAllLink) {
    showAllLink.addEventListener("mouseenter", () => { showAllLink.style.opacity = "1"; });
    showAllLink.addEventListener("mouseleave", () => { showAllLink.style.opacity = ".88"; });
  }
})();
