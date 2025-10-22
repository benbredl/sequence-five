// public/assets/image-generator.js
// Generator page logic (unchanged behaviors + fullscreen blur-up via NBViewer.open with previewEl)

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

  (function injectLocalStyles() {
    const styleId = "ig-light-styles";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      #${drop ? drop.id : "drop"} { transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .12s ease; will-change: background-color, border-color, box-shadow, transform; }
      #${drop ? drop.id : "drop"}:hover { cursor: pointer; }
      #${drop ? drop.id : "drop"}.is-hover:not(.has-upload) { background: radial-gradient(120% 120% at 50% 0%, var(--glass1) 0%, var(--glass2) 100%); border-color: color-mix(in oklab, var(--line-soft) 60%, white); box-shadow: 0 2px 12px rgba(0,0,0,.10), inset 0 0 0 1px rgba(255,255,255,.04); transform: translateY(-1px); }
      #${drop ? drop.id : "drop"}.is-drag:not(.has-upload) { background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border-style: dashed; border-color: color-mix(in oklab, var(--brand, #7c8cff) 50%, white 20%); box-shadow: 0 0 0 3px rgba(124,140,255,.15), 0 8px 24px rgba(0,0,0,.20); }

      #prompt, input#prompt, textarea#prompt { transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease; }
      #prompt:focus, #prompt:focus-visible, input#prompt:focus, input#prompt:focus-visible, textarea#prompt:focus, textarea#prompt:focus-visible {
        outline: none !important; border-color: color-mix(in oklab, var(--line-soft) 60%, white);
        box-shadow: 0 2px 12px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 3px rgba(255,255,255,.14);
        background: radial-gradient(120% 120% at 50% 0%, var(--glass1) 0%, var(--glass2) 100%);
      }

      img.blur-up { filter: blur(14px); transform: scale(1.02); transition: filter .35s ease, transform .35s ease, opacity .35s ease; display: block; width: 100%; height: auto; object-fit: cover; }
      img.blur-up.is-loaded { filter: blur(0); transform: none; }
    `;
    document.head.appendChild(s);
  })();

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
  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

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
  if (drop) {
    drop.addEventListener("mouseenter", () => drop.classList.add("is-hover"));
    drop.addEventListener("mouseleave", () => drop.classList.remove("is-hover"));

    drop.addEventListener("dragenter", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
    drop.addEventListener("dragleave", (e) => { if (!drop.contains(e.relatedTarget)) drop.classList.remove("is-drag"); });
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
      const reveal = () => { if (img.src !== thumbUrl) img.src = thumbUrl; requestAnimationFrame(settle); };
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

  /* -------------------- Card renderer (lightweight) -------------------- */
  function cardTile({ id, tinyUrl, thumbUrl, url, createdAt, type }, onDeleted) {
    const card = createEl("div", "card-gal");
    card.style.position = "relative";

    const link = createEl("a");
    link.href = "javascript:void(0)";
    link.style.display = "block";
    link.style.position = "relative";
    link.style.borderRadius = "16px";
    link.style.overflow = "hidden";
    link.style.border = "1px solid var(--line-soft)";

    const img = createProgressiveImage({ tinyUrl, thumbUrl: thumbUrl || url, alt: "Generated image" });
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
      card.appendChild(overlay);
    }

    // Fullscreen — pass lowSrc (thumb) and aspect from the tile we already have
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (!window.NBViewer || !NBViewer.open) return;

      const aspect = (img.naturalWidth && img.naturalHeight)
        ? (img.naturalWidth / img.naturalHeight)
        : (img.clientWidth && img.clientHeight ? img.clientWidth / img.clientHeight : null);

      NBViewer.open(url || thumbUrl, {
        imageId: id,
        createdAt,
        type,
        lowSrc: thumbUrl || tinyUrl || null,
        aspect: aspect || null
      });
    });

    return card;
  }

  async function preloadLastFive() {
    try {
      const r = await fetch("/api/archive?limit=6");
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

  function inferTypeFromContext() {
    return currentUpload && currentUpload.dataUrl ? "I2I" : "T2I";
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
            previewEl: img,          // pass preview for fullscreen blur-up
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

  showEmptyIfNeeded();
  preloadLastFive();

  if (showAllLink) {
    showAllLink.addEventListener("mouseenter", () => { showAllLink.style.opacity = "1"; });
    showAllLink.addEventListener("mouseleave", () => { showAllLink.style.opacity = ".88"; });
  }
})();
