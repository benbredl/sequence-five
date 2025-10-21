// public/assets/archive.js
// Archive page with tiny (blur-up) -> thumbnail swap,
// fullscreen uses only the high-res URL, and tamed infinite scroll.

/* ========== DOM helpers ========== */
const $ = (id) => document.getElementById(id);
const grid = $("grid");
const empty = $("empty");
const sentinel = $("sentinel");

if (!grid || !sentinel) {
  console.warn("[archive] grid/sentinel not found");
}

function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
function nearBottom(px = 300) {
  const doc = document.documentElement;
  const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  const remaining = doc.scrollHeight - (scrollTop + window.innerHeight);
  return remaining < px;
}
function setEmptyVisibility() { if (empty) empty.style.display = grid.children.length ? "none" : "block"; }

/* ========== Progressive images (tiny -> thumb) ========== */
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

/* ========== Card renderer (single type pill, hi-res only in fullscreen) ========== */
function cardForItem(item, onDeleted) {
  const card = el("div", "card-gal");
  card.style.position = "relative";

  const link = el("a");
  link.href = "javascript:void(0)";

  const img = createProgressiveImage(
    { tinyUrl: item.tinyUrl, thumbUrl: item.thumbUrl || item.url, alt: "Generated image" }
  );
  link.appendChild(img);
  card.appendChild(link);

  // Attach hover overlay (download / add / delete) + meta
  if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
    const overlay = NBViewer.attachHoverOverlay(
      card,
      item.thumbUrl || item.url || "",
      { id: item.id, createdAt: item.createdAt, type: item.type },
      onDeleted
    );
    // Ensure only one type pill
    try {
      const metaRow = overlay && overlay.querySelector(".gal-meta");
      if (metaRow) {
        const pills = metaRow.querySelectorAll(".type-pill");
        if (pills.length > 1) for (let i = 1; i < pills.length; i++) pills[i].remove();
      }
    } catch {}
    card.appendChild(overlay);
  }

  // Fullscreen: pass the HIGH-RES url (item.url), thumb as fallback
  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (!window.NBViewer || !NBViewer.open) return;
    NBViewer.open(item.url || item.thumbUrl, {
      imageId: item.id,
      createdAt: item.createdAt,
      type: item.type,
      onDeleted: () => {
        if (typeof onDeleted === "function") onDeleted();
        if (card && card.parentNode) card.parentNode.removeChild(card);
      }
    });
  });

  return card;
}

/* ========== Paging state ========== */
let cursor = null;
let isLoading = false;
let isEnd = false;
const seen = new Set();

/* ========== Fetch & render page ========== */
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
          url: it.url || null,                 // HI-RES (fullscreen only)
          thumbUrl: it.thumbUrl || null,       // Grid uses tiny->thumb swap
          tinyUrl: it.tinyUrl || null,
          createdAt: it.createdAt || null,
          type: it.type || null
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

/* ========== Startup prefill (only if page is shorter than viewport) ========== */
const PREFILL_MAX_LOOPS = 2; // keep it small so we don't load "almost everything"
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

/* ========== IntersectionObserver + light scroll fallback ========== */
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
    // Smaller rootMargin so we fetch only a bit before the sentinel appears
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
    if (nearBottom(300)) await fetchPage();
  });
}
window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize, { passive: true });
window.addEventListener("orientationchange", onScrollOrResize);

/* ========== Kickoff ========== */
(async () => {
  setupObserver();
  await fetchPage();              // first page
  await ensureFilledOnceOrTwice(); // at most one or two more if needed to fill viewport
  setEmptyVisibility();
})();
