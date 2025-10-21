// public/assets/image-generator.js
// Image generator page logic (clean skeleton, proper sizing, no premature tiny/blur).
// Adds hover overlay + passes metadata to NBViewer so fullscreen shows timestamp/res/type.

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

  const MAX_PARALLEL = Number((limitEl && limitEl.textContent) || "5") || 5;

  let inProgress = 0;
  let currentUpload = null;

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
    dropInner.innerHTML = "";
    const preview = document.createElement("img");
    preview.className = "preview";
    preview.alt = "Uploaded base image";
    preview.src = dataUrl;
    drop.appendChild(preview);

    // Make this info subtler/smaller
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
    const prev = drop.querySelector("img.preview");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    dropInner.innerHTML = "<div>Upload base image (optional)</div>";
  }

  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("is-drag"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("is-drag");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
  fileInput.addEventListener("change", () => { const f = fileInput.files && fileInput.files[0]; if (f) handleFile(f); });
  removeUpload.addEventListener("click", clearUpload);

  function skeletonCard() {
    const media = createEl("div", "result-media");
    media.style.border = "none";
    media.style.position = "relative";
    media.style.aspectRatio = "16 / 9";
    media.style.overflow = "hidden";
    media.style.marginBottom = "12px";
    const sk = createEl("div", "skeleton");
    const sp = createEl("div", "spinner-lg");
    sk.appendChild(sp);
    media.appendChild(sk);
    return { media, sk };
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
        const type = document.createElement("span");
        type.className = "type-pill";
        type.textContent = (meta.type || "").toLowerCase();
        type.style.textTransform = "none";
        metaRow.appendChild(type);
      }
      containerEl.appendChild(overlay);
      return;
    }

    // Fallback: minimal overlay
    const overlay = createEl("div", "gal-overlay");
    const metaDiv = createEl("div", "gal-meta");
    const ts = createEl("span"); ts.textContent = formatTimestamp(meta.createdAt || new Date());
    const type = createEl("span", "type-pill"); type.textContent = (meta.type || "").toLowerCase();
    type.style.textTransform = "none";
    metaDiv.appendChild(ts); metaDiv.appendChild(type);

    const actions = createEl("div", "gal-actions");
    const bDown = createEl("button", "icon-btn");
    bDown.innerHTML = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>";
    bDown.onclick = (e) => { e.stopPropagation(); forceDownload(meta.downloadUrl || imgUrl); };
    actions.appendChild(bDown);
    overlay.appendChild(metaDiv); overlay.appendChild(actions);
    containerEl.appendChild(overlay);
  }

  async function forceDownload(url, suggestedName) {
    try {
      const r = await fetch(url, { mode: 'cors' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const blob = await r.blob();
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = suggestedName || ('image-' + Date.now() + '.png');
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(objectUrl); a.remove(); }, 250);
    } catch (_){
      const a = document.createElement('a');
      a.href = url; a.setAttribute('download','image'); a.target = '_self';
      document.body.appendChild(a); a.click(); a.remove();
    }
  }

  function renderImageIntoMedia(media, imgUrl, meta) {
    media.style.border = "";
    media.style.position = "relative";
    media.style.aspectRatio = "16 / 9";
    media.style.overflow = "hidden";

    const sk = media.querySelector(".skeleton");
    if (sk && sk.parentNode) sk.parentNode.removeChild(sk);

    const img = new Image();
    img.alt = "Generated image";
    img.decoding = "async";
    img.loading = "eager";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.src = imgUrl;
    media.appendChild(img);

    addHoverOverlay(media, imgUrl, {
      id: meta.id || null,
      type: meta.type || "t2i",
      createdAt: meta.createdAt instanceof Date ? meta.createdAt : new Date(),
      downloadUrl: meta.archiveUrl || imgUrl,
      onDeleted: () => { if (media && media.parentNode) media.parentNode.removeChild(media); showEmptyIfNeeded(); }
    });

    media.style.cursor = "zoom-in";
    media.addEventListener("click", () => {
      const full = meta.archiveUrl || imgUrl;
      if (window.NBViewer && typeof NBViewer.open === "function") {
        NBViewer.open(full, {
          imageId: meta.id || null,
          createdAt: meta.createdAt || new Date(),
          type: meta.type || "t2i"
        });
      } else {
        window.open(full, "_blank", "noopener,noreferrer");
      }
    });
  }

  enhanceBtn.addEventListener("click", async () => {
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

  generateBtn.addEventListener("click", async () => {
    const text = promptEl.value.trim();
    if (!text) { alert("Please write a prompt."); return; }
    if (inProgress >= MAX_PARALLEL) { alert(`Please wait — max ${MAX_PARALLEL} generations in progress.`); return; }

    const { media } = skeletonCard();
    resultsGrid.prepend(media);
    showEmptyIfNeeded();

    setInProgress(inProgress + 1);
    generateBtn.disabled = inProgress >= MAX_PARALLEL;

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

      renderImageIntoMedia(media, objUrl, {
        id,
        archiveUrl,
        type: generationType,
        createdAt: new Date()
      });

      setTimeout(() => { if (blob) URL.revokeObjectURL(objUrl); }, 30000);
    } catch (e) {
      const sk = media.querySelector(".skeleton");
      if (sk) sk.innerHTML = `<div class="hint" style="font-size:12px">${(e.message || e)}</div>`;
    } finally {
      setInProgress(inProgress - 1);
      generateBtn.disabled = inProgress >= MAX_PARALLEL;
    }
  });

  // Initial state
  showEmptyIfNeeded();
})();
