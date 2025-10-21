/* public/assets/storyboard.js
   - Head card now shows ONLY the storyboard description (no duplicate title).
   - Image overlay on storyboard items no longer shows a timestamp; it only shows
     the stored high-res resolution (width × height) and the type pill.
*/

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };

  // Fallback for fullscreen viewer
  if (!window.NBViewer) {
    window.NBViewer = {
      open: (url) => window.open(url, '_blank', 'noopener'),
      openViewerWithActions: (opts) => window.open(opts && opts.url ? opts.url : '', '_blank', 'noopener')
    };
  }

  function getQuery(id) {
    const u = new URL(location.href);
    return u.searchParams.get(id);
  }

  function deriveType(modelUsed) {
    const s = String(modelUsed || "").toLowerCase();
    if (s.includes("prefix-only")) return "I2I";
    return "T2I";
  }

  const head = $('head');
  const itemsWrap = $('itemsWrap');
  const empty = $('empty');
  const pageTitle = $('pageTitle');

  const storyboardId = getQuery('id');
  if (!storyboardId) {
    head.innerHTML = "<div class='hint'>Missing storyboard id.</div>";
    return;
  }

  function itemCard(it) {
    const row = el('div', 'sb-item');
    const rail = el('div', 'sb-rail');
    const dot = el('div', 'sb-dot');
    rail.appendChild(dot);

    const card = el('div', 'sb-card');
    const inner = el('div', 'sb-inner');

    /* ----- Left: media with overlay + actions ----- */
    const mediaWrap = el('div', 'sb-media');

    const img = new Image();
    img.alt = 'storyboard item';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = it.thumbUrl || it.url;
    img.className = 'blur-up';
    img.addEventListener('load', () => { img.classList.add('is-loaded'); });
    img.addEventListener('click', () => window.NBViewer.openViewerWithActions({ url: it.url, imageId: it.imageId }));

    // Bottom overlay: resolution + type pill (NO timestamp)
    const overlay = el('div', 'sb-ov');

    // high-res resolution pulled from stored width/height
    const resSpan = el('span', 'sb-meta-small');
    if (Number(it.width) && Number(it.height)) {
      resSpan.textContent = `${it.width}×${it.height}`;
    } else {
      resSpan.textContent = "";
    }

    const typePill = el('span', 'sb-pill');
    const t = it.type || deriveType(it.modelUsed);
    typePill.textContent = (t || '').toLowerCase();

    overlay.appendChild(resSpan);
    overlay.appendChild(typePill);

    mediaWrap.appendChild(img);
    mediaWrap.appendChild(overlay);

    // Under-image actions
    const under = el('div', 'sb-actions');
    const bUpscale = el('button', 'btn-ghost'); bUpscale.textContent = 'Upscale';
    const bAnimate = el('button', 'btn-ghost'); bAnimate.textContent = 'Animate';
    bUpscale.onclick = () => alert('Upscale — coming soon');
    bAnimate.onclick = () => alert('Animate — coming soon');
    under.appendChild(bUpscale);
    under.appendChild(bAnimate);

    const left = el('div');
    left.appendChild(mediaWrap);
    left.appendChild(under);

    /* ----- Right: shot title + description + generator ----- */
    const right = el('div');
    const shotTitle = el('h3', 'sb-shot-title');
    shotTitle.textContent = 'Shot title';
    const shotDesc = el('p', 'sb-shot-desc');
    shotDesc.textContent = 'Shot description goes here. Add a brief explanation of the shot, camera movement, framing, or narrative intent.';
    const bGen = el('button', 'pill'); bGen.textContent = 'Generate description';
    bGen.onclick = () => {
      const base = (it.enhancedPrompt || '').trim();
      if (base) {
        shotDesc.textContent = base;
      } else {
        shotDesc.textContent = 'A cinematic take focusing on subject clarity and mood. Subtle camera drift, shallow DOF, and soft rim light enhance the focal point.';
      }
    };

    right.appendChild(shotTitle);
    right.appendChild(shotDesc);
    right.appendChild(bGen);

    /* ----- Compose card ----- */
    inner.appendChild(left);
    inner.appendChild(right);
    card.appendChild(inner);

    row.appendChild(rail);
    row.appendChild(card);

    return row;
  }

  async function load() {
    head.innerHTML = "<div class='hint'><span class='spinner'></span> Loading…</div>";
    try {
      const url = new URL('/api/storyboard', location.origin);
      url.searchParams.set('id', storyboardId);
      const r = await fetch(url.toString());
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Failed');

      // Page heading (top h1) is set to the storyboard title
      if (pageTitle) pageTitle.textContent = j.title || 'Storyboard';

      // Head card: ONLY description (no duplicate title here)
      head.innerHTML = '';
      const desc = el('div', 'head-desc'); desc.textContent = j.description || '';
      head.appendChild(desc);

      // Items
      itemsWrap.innerHTML = '';
      const arr = j.items || [];
      if (!arr.length) { empty.style.display = 'block'; return; }
      empty.style.display = 'none';
      arr.forEach((it) => itemsWrap.appendChild(itemCard(it)));
    } catch (e) {
      head.innerHTML = "<div class='hint'>"+ (e.message || e) +"</div>";
    }
  }

  load();
})();
