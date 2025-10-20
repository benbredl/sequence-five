// public/assets/generator.js
// Image generator page logic (clean skeleton, proper sizing, no premature tiny/blur).

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

  // Read the concurrent cap from the UI or fallback
  const MAX_PARALLEL = Number((limitEl && limitEl.textContent) || "5") || 5;

  let inProgress = 0;
  let currentUpload = null; // { dataUrl, name, size, type, width, height }

  /* ---------- Helpers ---------- */
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

  function createEl(tag, cls) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  function showEmptyIfNeeded() {
    const has = resultsGrid && resultsGrid.children.length > 0;
    if (empty) empty.style.display = has ? "none" : "block";
  }

  // Wrap fetch -> JSON with error surface
  async function jfetch(url, opts) {
    const r = await fetch(url, opts);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = j && (j.error || j.message) ? (j.error || j.message) : `HTTP ${r.status}`;
      throw new Error(msg);
    }
    return j;
  }

  /* ---------- Dropzone (optional image-to-image) ---------- */
  async function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) {
      alert("Please choose an image file.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);

    // Probe dimensions
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    const dim = await p;

    currentUpload = {
      dataUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      width: dim.w,
      height: dim.h
    };

    drop.classList.add("has-upload");
    dropInner.innerHTML = ""; // keep it clean
    const preview = document.createElement("img");
    preview.className = "preview";
    preview.alt = "Uploaded base image";
    preview.src = dataUrl;
    drop.appendChild(preview);

    uploadMeta.textContent = `${file.name} — ${bytes(file.size)} — ${dim.w}×${dim.h}`;
    removeUpload.style.display = "inline-flex";
  }

  function clearUpload() {
    currentUpload = null;
    uploadMeta.textContent = "";
    removeUpload.style.display = "none";
    drop.classList.remove("has-upload");
    // Remove preview img if any
    const prev = drop.querySelector("img.preview");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    dropInner.innerHTML = "<div>Upload base image (optional)</div>";
  }

  // Drag & drop
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("is-drag");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("is-drag");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  drop.addEventListener("click", () => fileInput.click());
  drop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (f) handleFile(f);
  });
  removeUpload.addEventListener("click", clearUpload);

  /* ---------- Skeleton / result card ---------- */
  function skeletonCard() {
    // Outer card: keep the CARD border
    const card = createEl("div", "result-card");
    // Media: NO border here to avoid double-border look while loading
    const media = createEl("div", "result-media");
    media.style.border = "none"; // <- prevent double border during skeleton

    // Force aspect box (16:9) so content never “explodes” in height
    media.style.position = "relative";
    media.style.aspectRatio = "16 / 9";
    media.style.overflow = "hidden";

    // Spinner
    const sk = createEl("div", "skeleton");
    const sp = createEl("div", "spinner-lg");
    sk.appendChild(sp);
    media.appendChild(sk);
    card.appendChild(media);
    return { card, media, sk };
  }

  function renderImageIntoMedia(media, imgUrl, meta) {
    // Ensure aspect box + proper fit
    media.style.border = ""; // restore the default border for final media
    media.style.position = "relative";
    media.style.aspectRatio = "16 / 9";
    media.style.overflow = "hidden";

    // Remove any skeleton
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

    // Clicking opens fullscreen (use full-res URL if we have it)
    media.style.cursor = "zoom-in";
    media.addEventListener("click", () => {
      const full = meta.galleryUrl || imgUrl;
      if (window.NBViewer && typeof NBViewer.open === "function") {
        NBViewer.open(full, {
          imageId: meta.id || null
        });
      } else {
        // Fallback: open in new tab
        window.open(full, "_blank", "noopener,noreferrer");
      }
    });
  }

  /* ---------- Enhance ---------- */
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
    } catch (e) {
      alert(e.message || e);
    } finally {
      enhanceBtn.disabled = false;
    }
  });

  /* ---------- Generate ---------- */
  generateBtn.addEventListener("click", async () => {
    const text = promptEl.value.trim();
    if (!text) { alert("Please write a prompt."); return; }
    if (inProgress >= MAX_PARALLEL) { alert(`Please wait — max ${MAX_PARALLEL} generations in progress.`); return; }

    // Create skeleton result card (clean, single border look)
    const { card, media } = skeletonCard();
    resultsGrid.prepend(card);
    showEmptyIfNeeded();

    setInProgress(inProgress + 1);
    generateBtn.disabled = inProgress >= MAX_PARALLEL;

    try {
      const body = { prompt: text, systemPrompt: (window.DEFAULT_SYSTEM_PROMPT || "") };
      if (currentUpload && currentUpload.dataUrl) {
        body.image = { dataUrl: currentUpload.dataUrl };
      }

      const j = await jfetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      // We get full-size as base64 (immediate). Previews (thumb/tiny) are created later by the Storage trigger.
      const base64 = String(j.imageBase64 || "");
      const galleryUrl = String(j.galleryUrl || ""); // full-res with token
      const id = j.id || null;

      // Create a temporary object URL for the immediate preview so it’s quick & sized properly
      const blob = await (async () => {
        try { return await (await fetch(`data:${j.mimeType || "image/png"};base64,${base64}`)).blob(); }
        catch { return null; }
      })();
      const objUrl = blob ? URL.createObjectURL(blob) : `data:${j.mimeType || "image/png"};base64,${base64}`;

      renderImageIntoMedia(media, objUrl, { id, galleryUrl });

      // Revoke the temp URL later to free memory
      setTimeout(() => { if (blob) URL.revokeObjectURL(objUrl); }, 30000);
    } catch (e) {
      // Error: replace skeleton with message
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
