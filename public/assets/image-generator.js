// public/assets/image-generator.js
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
  const useMj = $("useMj");
  const providerToggle = $("providerToggle");
  const resultsGrid = $("resultsGrid");
  const empty = $("empty");
  const inprogEl = $("inprog");
  const limitEl = $("limit");
  const showAllLink = $("showAll");
  const MAX_PARALLEL = Number((limitEl && limitEl.textContent) || "5") || 5;

  const MAX_LONG_EDGE = 1344;
  const JPEG_QUALITY = 0.9;

  let inProgress = 0;
  let currentUpload = null; // { dataUrl, name, sizeOrig, sizeOut, type, width, height }

  (function injectLocalStyles() {
    const styleId = "ig-light-styles";
    if (document.getElementById(styleId)) return;
    const s = document.createElement("style");
    s.id = styleId;
    s.textContent = `
      #${drop ? drop.id : "drop"} { transition: background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .12s ease; will-change: background-color, border-color, box-shadow, transform; }
      #${drop ? drop.id : "drop"}:hover { cursor: pointer; }
      #${drop ? drop.id : "drop"}.is-hover:not(.has-upload) { background: radial-gradient(120% 120% at 50% 0%, var(--glass1) 0%, var(--glass2) 100%); border-color: color-mix(in oklab, var(--line-soft) 60%, white); box-shadow: 0 2px 12px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.04); transform: translateY(-1px); }
      #${drop ? drop.id : "drop"}.is-drag:not(.has-upload) { background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)); border-style: dashed; border-color: color-mix(in oklab, var(--brand, #7c8cff) 50%, white 20%); box-shadow: 0 0 0 3px rgba(124,140,255,.15), 0 8px 24px rgba(0,0,0,.20); }
      #prompt, input#prompt, textarea#prompt { transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease; }
      #prompt.ig-updated { animation: ig-prompt-flash 1.2s ease-out 1; }
      img.blur-up { filter: blur(14px); transform: scale(1.02); transition: filter .35s ease, transform .35s ease, opacity .35s ease; display: block; width: 100%; height: auto; object-fit: cover; }
      img.blur-up.is-loaded { filter: blur(0); transform: none; }
      .mj-skel { position:relative; border:1px solid var(--line-soft); border-radius:16px; overflow:hidden; background:linear-gradient(180deg, var(--glass1), var(--glass2)); }
      .mj-skel .skeleton { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
      .mj-skel .skeleton::after{ content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent); animation: skel 1.2s linear infinite; }
      @keyframes skel { 100% { transform: translateX(100%); } }
      .mj-batch { display:contents; } /* ensure 4 tiles sit inline in grid */
    `;
    document.head.appendChild(s);
  })();

  // --- Provider toggle helpers ---
  function syncProviderToggleVisual() {
    if (!providerToggle || !useMj) return;
    const checked = !!useMj.checked;
    providerToggle.dataset.checked = checked ? "true" : "false";
    providerToggle.setAttribute("aria-pressed", checked ? "true" : "false");
  }
  function setProviderDisabled(disabled, reason = "") {
    if (!providerToggle || !useMj) return;
    useMj.disabled = !!disabled;
    providerToggle.setAttribute("aria-disabled", disabled ? "true" : "false");
    providerToggle.classList.toggle("is-disabled", !!disabled);
    providerToggle.title = disabled ? (reason || "Unavailable") : "Switch between Gemini and Midjourney (16:9)";
  }
  function attachProviderToggleEvents() {
    if (!providerToggle || !useMj) return;
    const toggle = () => {
      if (useMj.disabled) return;
      useMj.checked = !useMj.checked;
      syncProviderToggleVisual();
    };
    providerToggle.addEventListener("click", toggle);
    providerToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowLeft") { useMj.checked = false; syncProviderToggleVisual(); }
      if (e.key === "ArrowRight") { useMj.checked = true; syncProviderToggleVisual(); }
    });
    useMj.addEventListener("change", syncProviderToggleVisual);
    syncProviderToggleVisual();
  }

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

  // ---- Helpers for downscale + JPEG compress ----
  function imgFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = (e) => reject(e);
      im.src = dataUrl;
    });
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  async function downscaleAndCompress(dataUrl) {
    const im = await imgFromDataUrl(dataUrl);
    const w0 = im.naturalWidth || im.width || 0;
    const h0 = im.naturalHeight || im.height || 0;
    const long0 = Math.max(w0, h0);
    const scale = long0 > MAX_LONG_EDGE ? (MAX_LONG_EDGE / long0) : 1;
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, 0, 0, w, h);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("Compression failed");
    const outUrl = await blobToDataURL(blob);
    return { dataUrl: outUrl, w, h, bytes: blob.size };
  }

  // ---- Auth helpers ----
  async function waitForAuthUser(timeoutMs = 8000) {
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
      return firebase.auth().currentUser;
    }
    return new Promise((resolve, reject) => {
      if (!window.firebase || !firebase.auth) {
        return reject(new Error("Firebase auth not available"));
      }
      const t = setTimeout(() => reject(new Error("Auth timeout")), timeoutMs);
      const unsub = firebase.auth().onAuthStateChanged((user) => {
        clearTimeout(t);
        unsub();
        resolve(user || null);
      });
    });
  }

  async function getAuthContext() {
    try {
      const user = await waitForAuthUser();
      if (!user) throw new Error("Not signed in");
      const idToken = await user.getIdToken(false).catch(() => null);
      return { uid: user.uid, idToken };
    } catch (e) {
      console.warn("[image-generator] auth context failed:", e);
      return { uid: null, idToken: null };
    }
  }

  // ---- Upload handling ----
  async function handleFile(file) {
    if (!file || !/^image\//.test(file.type)) { alert("Please choose an image file."); return; }
    const origDataUrl = await readFileAsDataUrl(file);

    const origDim = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = origDataUrl;
    });

    let optimized;
    try {
      optimized = await downscaleAndCompress(origDataUrl);
    } catch (e) {
      console.warn("[upload optimize] failed, using original", e);
      const b = await (await fetch(origDataUrl)).blob();
      optimized = { dataUrl: origDataUrl, w: origDim.w, h: origDim.h, bytes: b.size || file.size };
    }

    currentUpload = {
      dataUrl: optimized.dataUrl,
      name: file.name,
      sizeOrig: file.size,
      sizeOut: optimized.bytes,
      type: "image/jpeg",
      width: optimized.w,
      height: optimized.h
    };

    drop.classList.add("has-upload");
    drop.classList.remove("is-drag");
    drop.classList.remove("is-hover");
    if (dropInner) dropInner.innerHTML = "";

    const prev = drop.querySelector("img.preview");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);

    const preview = document.createElement("img");
    preview.className = "preview";
    preview.alt = "Uploaded base image";
    preview.src = optimized.dataUrl;
    drop.appendChild(preview);

    if (uploadMeta) {
      uploadMeta.style.fontSize = "11px";
      uploadMeta.style.opacity = "0.85";
      uploadMeta.textContent = `${file.name} — ${bytes(file.size)} → ${bytes(optimized.bytes)} — `
        + `${optimized.w}×${optimized.h} (long edge ≤ ${MAX_LONG_EDGE}px)`;
    }
    if (removeUpload) removeUpload.style.display = "inline-flex";

    // Disable Midjourney when an image is present
    setProviderDisabled(true, "Disable upload to use Midjourney");
    useMj.checked = false;
    syncProviderToggleVisual();
  }

  function clearUpload() {
    currentUpload = null;
    if (uploadMeta) uploadMeta.textContent = "";
    if (removeUpload) removeUpload.style.display = "none";
    drop.classList.remove("has-upload", "is-hover", "is-drag");
    const prev = drop.querySelector("img.preview");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    if (dropInner) dropInner.innerHTML = "<div>Upload base image (optional)</div>";

    // Re-enable Midjourney
    setProviderDisabled(false, "");
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
    drop.addEventListener("click", () => fileInput && fileInput.click());
    drop.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && fileInput) fileInput.click(); });
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

  function pickFullUrl({ url, thumbUrl, upscaledUrl, state }) {
    const isUpscaled = String(state || "").toLowerCase() === "upscaled";
    if (isUpscaled && upscaledUrl) return upscaledUrl;
    return url || thumbUrl || upscaledUrl || "";
  }

  function cardTile({ id, tinyUrl, thumbUrl, url, upscaledUrl, createdAt, state }, onDeleted) {
    const card = document.createElement("div");
    card.className = "card-gal";
    card.style.position = "relative";

    const link = document.createElement("a");
    link.href = "javascript:void(0)";
    link.style.display = "block";
    link.style.position = "relative";
    link.style.borderRadius = "16px";
    link.style.overflow = "hidden";
    link.style.border = "1px solid var(--line-soft)";
    link.style.aspectRatio = "16 / 9";

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
        {
          id,
          createdAt,
          state,
          fullUrl: pickFullUrl({ url, thumbUrl, upscaledUrl, state }) || null
        },
        onDeleted
      );
      card.appendChild(overlay);
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (!window.NBViewer || !NBViewer.open) return;
      const aspect = 16 / 9;
      const fullForViewer = pickFullUrl({ url, thumbUrl, upscaledUrl, state });

      NBViewer.open(fullForViewer, {
        imageId: id,
        createdAt,
        state,
        lowSrc: thumbUrl || tinyUrl || null,
        aspect,
        onDeleted: () => {
          if (card && card.parentNode) card.parentNode.removeChild(card);
          showEmptyIfNeeded();
        }
      });
    });

    return card;
  }

  // Skeleton (16:9) for Midjourney placeholders
  function skeletonTile(slotIndex) {
    const card = document.createElement("div");
    card.className = "card-gal";
    card.setAttribute("data-slot", String(slotIndex));
    const box = document.createElement("div");
    box.className = "mj-skel";
    box.style.aspectRatio = "16 / 9";
    const sk = document.createElement("div");
    sk.className = "skeleton";
    const sp = document.createElement("div");
    sp.className = "spinner-lg";
    sk.appendChild(sp);
    box.appendChild(sk);
    card.appendChild(box);
    return card;
  }

  function currentStateFromContext() {
    return "base-image";
  }

  function addHoverOverlay(containerEl, imgUrl, meta) {
    if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
      const overlay = NBViewer.attachHoverOverlay(
        containerEl,
        imgUrl,
        {
          id: meta.id,
          createdAt: meta.createdAt ? meta.createdAt.toISOString() : new Date().toISOString(),
          state: meta.state || "base-image",
          archiveUrl: meta.archiveUrl || null,
          fullUrl: meta.archiveUrl || null
        },
        meta.onDeleted
      );
      containerEl.appendChild(overlay);
    }
  }

  // --- Preload user's own last images ---
  async function preloadLastFiveMine() {
    try {
      const { idToken, uid } = await getAuthContext();
      if (!uid || !idToken) {
        console.warn("[preloadLastFiveMine] no auth – skipping");
        return;
      }
      const params = new URLSearchParams({ limit: "6", my: "1" });
      const r = await fetch(`/api/archive?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${idToken}` }
      });
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
          upscaledUrl: it.upscaledUrl || null,
          createdAt: it.createdAt || null,
          state: it.state || "base-image",
        });
        frag.appendChild(card);
      }
      resultsGrid.appendChild(frag);
      showEmptyIfNeeded();
    } catch (e) {
      console.error("[preloadLastFiveMine]", e);
    }
  }

  // ---- Enhance button ----
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
      promptEl.classList.remove("ig-updated");
      promptEl.offsetWidth; // reflow
      promptEl.classList.add("ig-updated");
      setTimeout(() => promptEl.classList.remove("ig-updated"), 1300);
    } catch (e) { alert(e.message || e); }
    finally { enhanceBtn.disabled = false; }
  });

  // ---- Generate button (Gemini or Midjourney) ----
  generateBtn && generateBtn.addEventListener("click", async () => {
    const text = promptEl.value.trim();
    if (!text) { alert("Please write a prompt."); return; }
    if (inProgress >= MAX_PARALLEL) { alert(`Please wait — max ${MAX_PARALLEL} generations in progress.`); return; }

    const provider = (useMj && useMj.checked) ? "midjourney" : "gemini";
    const { idToken } = await getAuthContext().catch(() => ({ idToken: null }));

    // --- Midjourney flow (4 placeholders → 4 results, one-to-one) ---
    if (provider === "midjourney") {
      if (currentUpload) { alert("Remove the uploaded image to use Midjourney."); return; }

      // Create a logical batch and 4 independent placeholder slots
      const batch = document.createElement("div");
      batch.className = "mj-batch";
      const slots = Array.from({ length: 4 }, (_, i) => skeletonTile(i));
      // Prepend in reverse so slot 0 appears top-left
      for (let i = slots.length - 1; i >= 0; i--) resultsGrid.prepend(slots[i]);
      showEmptyIfNeeded();
      setInProgress(inProgress + 1);

      let taskId = null;
      try {
        const j = await jfetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
          },
          body: JSON.stringify({ prompt: text, provider: "midjourney" })
        });
        taskId = j.taskId || null;
        if (!taskId) throw new Error("Midjourney task not started");

        const seenIds = new Set();

        const replaceSlot = (index, item) => {
          const slot = resultsGrid.querySelector(`.card-gal[data-slot="${index}"]`);
          if (!slot || !slot.parentNode) return;
          const card = cardTile({
            id: item.id || null,
            tinyUrl: item.tinyUrl || null,
            thumbUrl: item.thumbUrl || null,
            url: item.url || null,
            upscaledUrl: item.upscaledUrl || null,
            createdAt: item.createdAt || null,
            state: item.state || "base-image",
          });
          slot.replaceWith(card);
        };

        const pollMidjourney = async () => {
          const url = new URL("/api/mj-result", location.origin);
          url.searchParams.set("taskId", taskId);
          const r = await fetch(url.toString(), {
            headers: { ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}) }
          });
          const x = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(x.error || `HTTP ${r.status}`);

          const raw = Array.isArray(x.items) ? x.items : [];
          // Guarantee at most 4, stable order; fill slots 0..3
          for (let i = 0; i < Math.min(4, raw.length); i++) {
            const it = raw[i];
            const id = String(it.id || "");
            if (!id || seenIds.has(id)) continue;
            seenIds.add(id);
            replaceSlot(i, it);
          }

          const done = (String(x.status || "").toUpperCase() === "COMPLETED") && (seenIds.size >= Math.min(4, raw.length) && seenIds.size >= 4);
          if (done) { setInProgress(inProgress - 1); return; }

          setTimeout(pollMidjourney, 1500);
        };

        pollMidjourney();
      } catch (e) {
        // On error, clear placeholders and show hint
        for (const s of slots) if (s && s.parentNode) s.parentNode.removeChild(s);
        const hint = document.createElement("div");
        hint.className = "card-gal";
        const box = document.createElement("div");
        box.className = "mj-skel";
        box.style.aspectRatio = "16 / 9";
        box.innerHTML = `<div class="hint" style="padding:12px;font-size:12px">${(e.message || e)}</div>`;
        hint.appendChild(box);
        resultsGrid.prepend(hint);
        setInProgress(inProgress - 1);
      }
      return;
    }

    // --- Gemini flow (unchanged) ---
    const { card, box } = (function () {
      const c = document.createElement("div");
      c.className = "card-gal";
      const b = document.createElement("div");
      b.style.position = "relative";
      b.style.width = "100%";
      b.style.aspectRatio = "16 / 9";
      b.style.borderRadius = "16px";
      b.style.overflow = "hidden";
      b.style.border = "1px solid var(--line-soft)";
      b.style.background = "linear-gradient(180deg, var(--glass1), var(--glass2))";
      const sk = document.createElement("div");
      sk.className = "skeleton";
      const sp = document.createElement("div");
      sp.className = "spinner-lg";
      sk.appendChild(sp);
      b.appendChild(sk);
      c.appendChild(b);
      return { card: c, box: b };
    })();

    resultsGrid.prepend(card);
    showEmptyIfNeeded();
    setInProgress(inProgress + 1);

    try {
      const body = { prompt: text };
      if (currentUpload && currentUpload.dataUrl) { body.image = { dataUrl: currentUpload.dataUrl }; }

      const j = await jfetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
        },
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

      card.innerHTML = "";
      const link = document.createElement("a");
      link.href = "javascript:void(0)";
      link.style.display = "block";
      link.style.position = "relative";
      link.style.borderRadius = "16px";
      link.style.overflow = "hidden";
      link.style.border = "1px solid var(--line-soft)";
      link.style.aspectRatio = "16 / 9";

      const img = new Image();
      img.alt = "Generated image";
      img.decoding = "async";
      img.loading = "eager";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.src = objUrl;

      link.appendChild(img);
      card.appendChild(link);

      addHoverOverlay(card, objUrl, {
        id,
        archiveUrl,
        state: currentStateFromContext(),
        createdAt: new Date(),
        onDeleted: () => { if (card && card.parentNode) card.parentNode.removeChild(card); showEmptyIfNeeded(); }
      });

      link.addEventListener("click", () => {
        const full = archiveUrl || objUrl;
        if (window.NBViewer && typeof NBViewer.open === "function") {
          NBViewer.open(full, {
            previewEl: img,
            imageId: id || null,
            createdAt: new Date(),
            state: currentStateFromContext(),
            onDeleted: () => {
              if (card && card.parentNode) card.parentNode.removeChild(card);
              showEmptyIfNeeded();
            }
          });
        } else {
          window.open(full, "_blank", "noopener,noreferrer");
        }
      });

      setTimeout(() => { if (blob) URL.revokeObjectURL(objUrl); }, 30000);
    } catch (e) {
      card.innerHTML = "";
      const box = document.createElement("div");
      box.className = "mj-skel";
      box.style.aspectRatio = "16 / 9";
      box.innerHTML = `<div class="hint" style="padding:12px;font-size:12px">${(e.message || e)}</div>`;
      card.appendChild(box);
    } finally {
      setInProgress(inProgress - 1);
      generateBtn.disabled = inProgress >= MAX_PARALLEL;
    }
  });

  showEmptyIfNeeded();
  preloadLastFiveMine();
  attachProviderToggleEvents();

  if (showAllLink) {
    showAllLink.addEventListener("mouseenter", () => { showAllLink.style.opacity = "1"; });
    showAllLink.addEventListener("mouseleave", () => { showAllLink.style.opacity = ".88"; });
  }
})();
