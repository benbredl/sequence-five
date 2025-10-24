/* public/assets/archive.js
   Archive page with infinite scroll + client-resized upload (max 1344 long edge, preserve format).
   Master is not additionally compressed client-side beyond necessary browser re-encode.
*/
const $ = (id) => document.getElementById(id);
const grid = $("grid");
const empty = $("empty");
const sentinel = $("sentinel");

// Upload controls
const btnUpload = $("btnUpload");
const inputUpload = $("inputUpload");

if (!grid || !sentinel) {
  console.warn("[archive] grid/sentinel not found");
}

function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }

function setEmptyVisibility() { if (empty) empty.style.display = grid.children.length ? "none" : "block"; }

function createProgressiveImage({ tinyUrl, thumbUrl, alt = "" }) {
  const img = document.createElement("img");
  img.decoding = "async";
  img.loading = "lazy";
  img.alt = alt;
  img.className = "blur-up";
  img.src = tinyUrl || thumbUrl;

  const settle = () => { img.classList.add("is-loaded"); };

  if (tinyUrl && thumbUrl && thumbUrl !== tinyUrl) {
    const hi = new Image();
    hi.decoding = "async";
    hi.src = thumbUrl;
    const reveal = () => { img.src = thumbUrl; requestAnimationFrame(settle); };
    if (hi.decode) {
      hi.decode().then(reveal).catch(() => hi.addEventListener("load", reveal, { once: true }));
    } else {
      hi.addEventListener("load", reveal, { once: true });
    }
    hi.addEventListener("error", () => requestAnimationFrame(settle), { once: true });
  } else {
    img.addEventListener("load", settle, { once: true });
    img.addEventListener("error", settle, { once: true });
  }
  return img;
}

function cardForItem(item, onDeleted) {
  const card = el("div", "card-gal");
  card.style.position = "relative";

  const link = el("a");
  link.href = "javascript:void(0)";

  const img = createProgressiveImage(
    { tinyUrl: item.tinyUrl, thumbUrl: item.thumbUrl || item.url, alt: "Image" }
  );
  link.appendChild(img);
  card.appendChild(link);

  if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
    const overlay = NBViewer.attachHoverOverlay(
      card,
      item.thumbUrl || item.url || "",
      {
        id: item.id,
        createdAt: item.createdAt,
        state: item.state || "base-image",
        fullUrl: item.url || null,
        upscaledUrl: item.upscaledUrl || null
      },
      onDeleted
    );
    try {
      const metaRow = overlay && overlay.querySelector(".gal-meta");
      if (metaRow) {
        const pills = metaRow.querySelectorAll(".type-pill");
        if (pills.length > 1) for (let i = 1; i < pills.length; i++) pills[i].remove();
      }
    } catch {}
    card.appendChild(overlay);
  }

  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (!window.NBViewer || !NBViewer.open) return;
    const aspect = (img.naturalWidth && img.naturalHeight)
      ? (img.naturalWidth / img.naturalHeight)
      : (img.clientWidth && img.clientHeight ? img.clientWidth / img.clientHeight : null);

    const openUrl = item.url || item.thumbUrl;

    NBViewer.open(openUrl, {
      imageId: item.id,
      createdAt: item.createdAt,
      state: item.state || "base-image",
      lowSrc: item.thumbUrl || item.tinyUrl || null,
      aspect: aspect || null,
      upscaledUrl: item.upscaledUrl || null,
      onDeleted: () => {
        if (card && card.parentNode) card.parentNode.removeChild(card);
        setEmptyVisibility();
      }
    });
  });

  return card;
}

let cursor = null;
let isLoading = false;
let isEnd = false;
const seen = new Set();

async function fetchPage() {
  if (!grid || !sentinel) return;
  if (isLoading || isEnd) return;
  isLoading = true;

  try {
    const params = new URLSearchParams();
    params.set("limit", "24");
    if (cursor) params.set("cursor", cursor);

    const r = await fetch(`/api/archive?${params.toString()}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Failed to load");

    const items = Array.isArray(j.items) ? j.items : [];
    const next = j.nextCursor || null;

    const frag = document.createDocumentFragment();
    for (const it of items) {
      const id = String(it.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);

      const card = cardForItem(
        {
          id,
          url: it.url || null,
          thumbUrl: it.thumbUrl || null,
          tinyUrl: it.tinyUrl || null,
          createdAt: it.createdAt || null,
          state: it.state || "base-image",
          upscaledUrl: it.upscaledUrl || null
        },
        () => { seen.delete(id); }
      );
      frag.appendChild(card);
    }
    grid.appendChild(frag);

    cursor = next;
    if (!next) {
      isEnd = true;
      if (io) io.disconnect();
      sentinel.style.display = "none";
    } else {
      sentinel.style.display = "block";
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading = false;
    setEmptyVisibility();
  }
}

const PREFILL_MAX_LOOPS = 2;
async function ensureFilledOnceOrTwice() {
  let loops = 0;
  while (
    !isEnd &&
    !isLoading &&
    document.documentElement.scrollHeight <= window.innerHeight + 80 &&
    loops < PREFILL_MAX_LOOPS
  ) {
    await fetchPage();
    loops++;
  }
}

let io = null;
function setupObserver() {
  if (!sentinel) return;
  if (io) io.disconnect();
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) fetchPage();
      }
    },
    { root: null, rootMargin: "300px 0px", threshold: 0 }
  );
  io.observe(sentinel);
}

let ticking = false;
function onScrollOrResize() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(async () => {
    ticking = false;
    const doc = document.documentElement;
    const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    const remaining = doc.scrollHeight - (scrollTop + window.innerHeight);
    if (remaining < 300) await fetchPage();
  });
}

window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize, { passive: true });
window.addEventListener("orientationchange", onScrollOrResize);

// ------------------- Upload flow (client-resize only) -------------------

function skeletonTile() {
  const card = el("div", "card-gal");
  card.style.position = "relative";
  const box = el("div");
  box.style.position = "relative";
  box.style.width = "100%";
  box.style.aspectRatio = "16 / 9";
  box.style.borderRadius = "16px";
  box.style.overflow = "hidden";
  box.style.border = "1px solid var(--line-soft)";
  box.style.background = "linear-gradient(180deg, var(--glass1), var(--glass2))";
  const sk = el("div", "skeleton");
  const sp = el("div", "spinner-lg");
  sk.appendChild(sp);
  box.appendChild(sk);
  card.appendChild(box);
  return { card, box };
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function imgFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
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

/**
 * Resize to max 1344 long edge, preserving the original format.
 * We use high quality (0.95) for JPEG/WebP to avoid extra artifacts.
 * PNG ignores quality and stays lossless.
 */
async function downscaleOnlyNoExtraCompression(dataUrl, originalMime) {
  const im = await imgFromDataUrl(dataUrl);
  const w0 = im.naturalWidth || im.width || 0;
  const h0 = im.naturalHeight || im.height || 0;
  const long0 = Math.max(w0, h0) || 1;

  const MAX_LONG_EDGE = 1344;
  const scale = long0 > MAX_LONG_EDGE ? (MAX_LONG_EDGE / long0) : 1;
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(im, 0, 0, w, h);

  const outType = /^image\/(png|jpeg|jpg|webp)$/i.test(originalMime) ? originalMime : "image/png";
  const quality = /jpeg|jpg|webp/i.test(outType) ? 0.95 : undefined;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, outType, quality));
  if (!blob) throw new Error("Client resize failed");
  const outUrl = await blobToDataURL(blob);
  return { dataUrl: outUrl, mimeType: outType, width: w, height: h, bytes: blob.size };
}

async function jpost(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

async function handleUploadFile(file) {
  if (!file || !/^image\//.test(file.type)) { alert("Please choose an image file."); return; }

  const { card, box } = skeletonTile();
  grid.prepend(card);
  setEmptyVisibility();

  try {
    const original = await readAsDataURL(file);
    const resized = await downscaleOnlyNoExtraCompression(original, file.type);

    const resp = await jpost("/api/archive/upload", {
      name: file.name,
      image: { dataUrl: resized.dataUrl } // master saved as-is on server
    });

    const tile = cardForItem({
      id: resp.id,
      url: resp.url,
      thumbUrl: resp.thumbUrl,
      tinyUrl: resp.tinyUrl,
      upscaledUrl: resp.upscaledUrl || null,
      createdAt: resp.createdAt || new Date().toISOString(),
      state: resp.state || "base-image"
    });
    card.replaceWith(tile);
  } catch (e) {
    console.error(e);
    box.innerHTML = `<div class="hint" style="font-size:12px">${(e.message || e)}</div>`;
  }
}

btnUpload && btnUpload.addEventListener("click", () => inputUpload && inputUpload.click());
inputUpload && inputUpload.addEventListener("change", () => {
  const f = inputUpload.files && inputUpload.files[0];
  if (f) handleUploadFile(f);
  inputUpload.value = "";
});

// ------------------- Boot -------------------

(async () => {
  setupObserver();
  await fetchPage();
  await ensureFilledOnceOrTwice();
  setEmptyVisibility();
})();
