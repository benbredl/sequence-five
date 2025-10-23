// Archive page with tiny (blur-up) -> thumbnail swap,
// fullscreen now receives lowSrc + aspect to avoid layout shift.
// Uses "state" (not "type") in the overlay and fullscreen meta.

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

/* ========== Card renderer (pass lowSrc + aspect to fullscreen) ========== */
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

  // Hover overlay
  if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
    const overlay = NBViewer.attachHoverOverlay(
      card,
      item.thumbUrl || item.url || "",
      {
        id: item.id,
        createdAt: item.createdAt,
        state: item.state || "base-image",
        fullUrl: item.url || null       // <-- provide hi-res URL for downloads
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

    // Compute an aspect ratio from the image we already have (no extra reads)
    const aspect = (img.naturalWidth && img.naturalHeight)
      ? (img.naturalWidth / img.naturalHeight)
      : (img.clientWidth && img.clientHeight ? img.clientWidth / img.clientHeight : null);

    NBViewer.open(item.url || item.thumbUrl, {
      imageId: item.id,
      createdAt: item.createdAt,
      state: item.state || "base-image",
      lowSrc: item.thumbUrl || item.tinyUrl || null,  // show blurred first
      aspect: aspect || null,                          // lock size → no shift
      onDeleted: () => {                               // <-- remove from grid after fullscreen delete
        if (card && card.parentNode) card.parentNode.removeChild(card);
        setEmptyVisibility();
      }
    });
  });

  return card;
}

/* ========== Paging state & fetch ========== */
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
          state: it.state || "base-image"
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

/* ========== IO + kickoff ========== */
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
    if (nearBottom(300)) await fetchPage();
  });
}
window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize, { passive: true });
window.addEventListener("orientationchange", onScrollOrResize);

(async () => {
  setupObserver();
  await fetchPage();
  await ensureFilledOnceOrTwice();
  setEmptyVisibility();
})();
