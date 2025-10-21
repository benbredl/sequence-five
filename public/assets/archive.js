// public/assets/archive.js
// Archive page with robust infinite scroll (IO + scroll fallback),
// progressive images (tiny -> thumb), fullscreen (NBViewer).

/* ========== DOM helpers ========== */
const $ = (id) => document.getElementById(id);
const grid = $("grid");
const empty = $("empty");
const sentinel = $("sentinel");
const refreshBtn = $("refresh"); // (can be absent now)

function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
function nearBottom(px = 1200) {
  const doc = document.documentElement;
  const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  const remaining = doc.scrollHeight - (scrollTop + window.innerHeight);
  return remaining < px;
}
function setEmptyVisibility() { empty.style.display = grid.children.length ? "none" : "block"; }

/* ========== Progressive images ========== */
function createProgressiveImage({ tinyUrl, thumbUrl, alt = "" }, onSettled) {
  const img = document.createElement("img");
  img.decoding = "async";
  img.loading = "lazy";
  img.alt = alt;
  img.className = "blur-up";
  img.src = tinyUrl || thumbUrl;

  const settle = () => { img.classList.add("is-loaded"); if (typeof onSettled === "function") onSettled(); };

  if (thumbUrl && thumbUrl !== tinyUrl) {
    const hi = new Image();
    hi.decoding = "async";
    hi.src = thumbUrl;
    hi.onload = () => { img.src = thumbUrl; requestAnimationFrame(settle); };
    hi.onerror = () => requestAnimationFrame(settle);
  } else {
    img.addEventListener("load", settle, { once: true });
    img.addEventListener("error", settle, { once: true });
  }
  return img;
}

/* ========== Card renderer ========== */
function cardForItem(item, onDeleted) {
  const card = el("div", "card-gal");
  card.style.position = "relative";

  const link = el("a");
  link.href = "javascript:void(0)";

  const img = createProgressiveImage(
    { tinyUrl: item.tinyUrl, thumbUrl: item.thumbUrl || item.url, alt: "Generated image" },
    () => { ensureFilled(2); }
  );
  link.appendChild(img);
  card.appendChild(link);

  if (window.NBViewer && typeof NBViewer.attachHoverOverlay === "function") {
    const overlay = NBViewer.attachHoverOverlay(
      card,
      item.thumbUrl || item.url || "",
      { id: item.id, createdAt: item.createdAt, type: item.type },
      onDeleted
    );
    card.appendChild(overlay);
  }

  // Fullscreen (pass metadata so infobar can render)
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
        ensureFilled(4);
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

/* ========== Fill viewport helper (works at all breakpoints) ========== */
async function ensureFilled(maxLoops = 6) {
  let loops = 0;
  while (!isEnd && !isLoading && (nearBottom(1400) || document.documentElement.scrollHeight <= window.innerHeight + 200) && loops < maxLoops) {
    await fetchPage();
    loops++;
  }
}

/* ========== IntersectionObserver + scroll/resize fallback ========== */
let io = null;
function setupObserver() {
  if (io) io.disconnect();
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) fetchPage();
    }
  }, { root: null, rootMargin: "1500px 0px", threshold: 0 });
  io.observe(sentinel);
}

let ticking = false;
function onScrollOrResize() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(async () => {
    ticking = false;
    if (nearBottom(1400)) await fetchPage();
    await ensureFilled(2);
  });
}
window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize, { passive: true });
window.addEventListener("orientationchange", onScrollOrResize);

const mo = new MutationObserver(() => ensureFilled(2));
mo.observe(grid, { childList: true, subtree: false });

/* ========== Optional Refresh (if present) ========== */
if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    grid.innerHTML = "";
    empty.style.display = "none";
    sentinel.style.display = "block";
    seen.clear();
    cursor = null;
    isEnd = false;
    isLoading = false;
    setupObserver();
    await fetchPage();
    await ensureFilled(8);
  });
}

/* ========== Kickoff ========== */
setupObserver();
(async () => {
  await fetchPage();
  await ensureFilled(8);
  setEmptyVisibility();
})();
