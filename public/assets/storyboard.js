/* public/assets/storyboard.js
   - Handle-only drag & drop reordering (large-gap indices)
   - Container-based DnD for reliability
   - DESCRIPTION FIX: textarea now reads/writes item.description (not prompt)
   - Autosave description with small "Saved" tick
*/

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };
  const GAP = 1000;

  if (!window.NBViewer) {
    window.NBViewer = {
      open: (url) => window.open(url, '_blank', 'noopener'),
      openViewerWithActions: (opts) => window.open(opts && opts.url ? opts.url : '', '_blank', 'noopener')
    };
  }

  function getParam(name) {
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  const headCard   = $('head');
  const itemsWrap  = $('itemsWrap');
  const empty      = $('empty');
  const pageTitle  = $('pageTitle');
  const storyboardId = getParam('id');

  if (!storyboardId) {
    headCard.innerHTML = "<div class='hint'>Missing storyboard id.</div>";
    return;
  }

  const TICK_SVG = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>";
  const HANDLE_SVG = "<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'><circle cx='7' cy='6' r='1.4'/><circle cx='12' cy='6' r='1.4'/><circle cx='17' cy='6' r='1.4'/><circle cx='7' cy='12' r='1.4'/><circle cx='12' cy='12' r='1.4'/><circle cx='17' cy='12' r='1.4'/><circle cx='7' cy='18' r='1.4'/><circle cx='12' cy='18' r='1.4'/><circle cx='17' cy='18' r='1.4'/></svg>";

  function makeItem(it) {
    const row = el('div', 'sb-item');
    row.dataset.imageId = it.imageId;
    if (it.orderIndex != null) row.dataset.orderIndex = String(it.orderIndex);

    // Column 1: rail + handle
    const rail = el('div', 'sb-rail');
    const handle = el('div', 'sb-handle');
    handle.innerHTML = HANDLE_SVG;
    handle.title = 'Drag to reorder';
    rail.appendChild(handle);

    // Column 2: card
    const card = el('div', 'sb-card');
    const inner = el('div', 'sb-inner');

    const media = el('div', 'sb-media');
    const img = new Image();
    img.alt = 'storyboard item';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = it.thumbUrl || it.url;
    media.appendChild(img);

    const rhs = el('div');
    const label = el('div', 'sb-desc-label');
    label.textContent = 'Shot description';

    const desc = el('textarea', 'sb-desc');
    desc.placeholder = 'Describe the shot, movement, framing, intent…';

    // ***** DESCRIPTION FIX: prefer DB field, not prompt *****
    const dbDescription = (it.description || '').trim();
    desc.value = dbDescription;

    // Saved tick
    const saved = el('div', 'sb-saved');
    saved.innerHTML = TICK_SVG + "<span>Saved</span>";

    // Debounced autosave to description endpoint
    let debounceTimer = null;
    async function saveDescription(val) {
      try {
        await fetch('/api/storyboard/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyboardId, imageId: it.imageId, description: val })
        });
        saved.classList.add('show');
        setTimeout(() => saved.classList.remove('show'), 1100);
      } catch (e) {
        console.error('[description save] failed', e);
      }
    }

    desc.addEventListener('input', () => {
      const val = desc.value;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => saveDescription(val), 450);
    });

    // Also save on blur just in case user types and clicks away very quickly
    desc.addEventListener('blur', () => {
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      saveDescription(desc.value);
    });

    rhs.appendChild(label);
    rhs.appendChild(desc);
    rhs.appendChild(saved);

    inner.appendChild(media);
    inner.appendChild(rhs);
    card.appendChild(inner);

    // Column 3: buttons
    const buttons = el('div', 'sb-buttons');
    const bUpscale = el('button', 'btn-small'); bUpscale.textContent = 'Upscale';
    const bVideo   = el('button', 'btn-small'); bVideo.textContent   = 'Generate video';
    bUpscale.onclick = () => alert('Upscale — coming soon');
    bVideo.onclick   = () => alert('Generate video — coming soon');
    buttons.appendChild(bUpscale);
    buttons.appendChild(bVideo);

    // Compose row
    row.appendChild(rail);
    row.appendChild(card);
    row.appendChild(buttons);

    // Enable dragging only via handle
    row.draggable = false;
    const enableDrag = () => { row.draggable = true; };
    const disableDrag = () => { row.draggable = false; };
    handle.addEventListener('mousedown', enableDrag);
    handle.addEventListener('touchstart', enableDrag, { passive: true });
    row.addEventListener('dragend', disableDrag);

    // Visual state on drag
    row.addEventListener('dragstart', (e) => {
      row.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.dataset.imageId || '');
        try {
          const ghost = row.cloneNode(true);
          ghost.style.position = 'absolute';
          ghost.style.top = '-9999px';
          ghost.style.width = `${row.offsetWidth}px`;
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 20, 20);
          setTimeout(() => document.body.removeChild(ghost), 0);
        } catch {}
      }
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));

    return row;
  }

  /* ---------- Drag & Drop (container-based) ---------- */
  let draggingEl = null;
  let placeholder = null;

  function ensurePlaceholder() {
    if (placeholder) return placeholder;
    placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    return placeholder;
  }

  function sbItems() {
    return Array.from(itemsWrap.querySelectorAll('.sb-item'));
  }

  function itemAtY(y) {
    const candidates = sbItems().filter((n) => !n.classList.contains('dragging'));
    let closest = { el: null, offset: Number.NEGATIVE_INFINITY };
    for (const node of candidates) {
      const box = node.getBoundingClientRect();
      const offset = y - (box.top + box.height / 2);
      if (offset < 0 && offset > closest.offset) closest = { el: node, offset };
    }
    return closest.el; // element that comes AFTER the placeholder
  }

  itemsWrap.addEventListener('dragover', (e) => {
    if (!draggingEl) draggingEl = itemsWrap.querySelector('.sb-item.dragging');
    if (!draggingEl) return;
    e.preventDefault();
    const ph = ensurePlaceholder();
    const after = itemAtY(e.clientY);
    if (!after) {
      itemsWrap.appendChild(ph);
    } else {
      itemsWrap.insertBefore(ph, after);
    }
  });

  itemsWrap.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (!draggingEl) draggingEl = itemsWrap.querySelector('.sb-item.dragging');
    if (!draggingEl) return;

    const ph = placeholder;
    if (ph && ph.parentNode) {
      itemsWrap.insertBefore(draggingEl, ph);
      ph.remove();
      placeholder = null;
    }

    // Compute neighbors
    const prev = draggingEl.previousElementSibling && draggingEl.previousElementSibling.classList.contains('sb-item')
      ? draggingEl.previousElementSibling
      : null;
    const next = draggingEl.nextElementSibling && draggingEl.nextElementSibling.classList.contains('sb-item')
      ? draggingEl.nextElementSibling
      : null;

    const prevVal = prev ? Number(prev.dataset.orderIndex || '0') : null;
    const nextVal = next ? Number(next.dataset.orderIndex || '0') : null;

    let newOrder;
    if (prevVal != null && nextVal != null && isFinite(prevVal) && isFinite(nextVal)) {
      const mid = (prevVal + nextVal) / 2;
      newOrder = (mid !== prevVal && mid !== nextVal) ? mid : prevVal + GAP;
    } else if (prevVal != null && isFinite(prevVal)) {
      newOrder = prevVal + GAP;
    } else if (nextVal != null && isFinite(nextVal)) {
      newOrder = nextVal - GAP;
    } else {
      newOrder = 1_000_000;
    }

    draggingEl.dataset.orderIndex = String(newOrder);

    try {
      const imageId = draggingEl.dataset.imageId;
      await fetch('/api/storyboard/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboardId, imageId, newOrderIndex: newOrder })
      });
    } catch (err) {
      console.error('[reorder] failed', err);
    } finally {
      if (draggingEl) draggingEl.classList.remove('dragging');
      draggingEl = null;
    }
  });

  /* ---------- Load data ---------- */
  async function load() {
    headCard.innerHTML = "<div class='hint'><span class='spinner'></span> Loading…</div>";
    try {
      const url = new URL('/api/storyboard', location.origin);
      url.searchParams.set('id', storyboardId);
      const r = await fetch(url.toString());
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed to load storyboard');

      if (pageTitle) pageTitle.textContent = j.title || 'Storyboard';
      headCard.innerHTML = '';
      const desc = el('div', 'head-desc');
      desc.textContent = j.description || '';
      headCard.appendChild(desc);

      itemsWrap.innerHTML = '';
      const arr = Array.isArray(j.items) ? j.items : [];
      if (!arr.length) { empty.style.display = 'block'; return; }
      empty.style.display = 'none';

      const frag = document.createDocumentFragment();
      arr.forEach((it) => frag.appendChild(makeItem(it)));
      itemsWrap.appendChild(frag);
    } catch (e) {
      headCard.innerHTML = "<div class='hint'>" + (e.message || e) + "</div>";
    }
  }

  load();
})();
