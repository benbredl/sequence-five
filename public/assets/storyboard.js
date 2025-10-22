/* public/assets/storyboard.js
   (…existing features…)
   + Fullscreen blur-up: pass the decoded thumbnail <img> to NBViewer.open
*/

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };
  const GAP = 1000;
  const AUTOSAVE_IDLE_MS = 1200;
  const MIN_IDLE_ON_BLUR_MS = 1000;

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

  /* Progressive images (tiny -> thumb) */
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
      const reveal = () => {
        if (img.src !== thumbUrl) img.src = thumbUrl;
        requestAnimationFrame(settle);
      };
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

  function indicateReordered(cardEl) {
    if (!cardEl) return;
    cardEl.classList.remove('reordered');
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    cardEl.offsetWidth;
    cardEl.classList.add('reordered');
    setTimeout(() => cardEl.classList.remove('reordered'), 1200);
  }

  function stateToLabel(it){
    const s = (it.state || '').toLowerCase();
    if (s === 'video') return 'video';
    if (s === 'upscaled') return 'upscaled';
    if (s === 'base' || s === 'base-image' || s === 'base image') return 'base image';
    if (it.isVideo) return 'video';
    if (it.isUpscaled) return 'upscaled';
    return 'base image';
  }

  function makeItem(it) {
    const row = el('div', 'sb-item');
    row.dataset.imageId = it.imageId;
    if (it.orderIndex != null) row.dataset.orderIndex = String(it.orderIndex);

    const rail = el('div', 'sb-rail');
    const handle = el('div', 'sb-handle');
    handle.innerHTML = HANDLE_SVG;
    handle.title = 'Drag to reorder';
    rail.appendChild(handle);

    const card = el('div', 'sb-card');
    const inner = el('div', 'sb-inner');

    const media = el('div', 'sb-media');

    // Progressive blur-up thumbnail
    const img = createProgressiveImage({
      tinyUrl: it.tinyUrl || null,
      thumbUrl: it.thumbUrl || it.url || null,
      alt: "storyboard item"
    });
    media.appendChild(img);

    const pill = el('div', 'sb-pill');
    pill.textContent = stateToLabel(it);
    media.appendChild(pill);

    // Open fullscreen on click (use high-res if available)
    media.addEventListener('click', () => {
      const full = it.url || it.thumbUrl;
      if (!full) return;

      // aspect from the image we already have in the card
      const aspect =
        (img.naturalWidth && img.naturalHeight)
          ? (img.naturalWidth / img.naturalHeight)
          : (img.clientWidth && img.clientHeight ? img.clientWidth / img.clientHeight : null);

      if (window.NBViewer && typeof NBViewer.open === 'function') {
        NBViewer.open(full, {
          imageId: it.imageId,
          createdAt: it.addedAt || undefined,
          type: it.state || 'base-image',
          lowSrc: it.thumbUrl || it.tinyUrl || null,
          aspect: aspect || null
        });
      } else {
        window.open(full, '_blank', 'noopener,noreferrer');
      }
    });

    const rhs = el('div', 'sb-right');
    const label = el('div', 'sb-desc-label');
    label.textContent = 'Shot description';

    const desc = el('textarea', 'sb-desc');
    desc.placeholder = 'Describe the shot, movement, framing, intent…';

    const dbDescription = (it.description || '').trim();
    desc.value = dbDescription;

    let lastSavedValue = dbDescription;

    const genRow = el('div', 'sb-actions');
    const genBtn = el('button', 'btn-small');
    genBtn.textContent = 'Generate description';
    genBtn.title = 'Use image + storyboard context to generate a cinematic description';

    const saved = el('div', 'sb-saved');
    saved.innerHTML = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg><span>Saved</span>";

    genRow.appendChild(genBtn);
    genRow.appendChild(saved);

    let debounceTimer = null;
    let lastInputAt = 0;
    const normalize = (v) => (v == null ? '' : String(v)).replace(/\r\n/g, '\n').trim();

    async function saveDescription(valRaw) {
      const val = normalize(valRaw);
      if (val === lastSavedValue) return;
      desc.classList.add('saving');
      try {
        const r = await fetch('/api/storyboard/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyboardId, imageId: it.imageId, description: val })
        });
        if (!r.ok) {
          console.error('[description save] HTTP', r.status);
        } else {
          lastSavedValue = val;
          saved.classList.add('show');
          setTimeout(() => saved.classList.remove('show'), 1100);
        }
      } catch (e) {
        console.error('[description save] failed', e);
      } finally {
        setTimeout(() => desc.classList.remove('saving'), 150);
      }
    }

    const scheduleAutosave = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (normalize(desc.value) === lastSavedValue) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (normalize(desc.value) !== lastSavedValue) {
          saveDescription(desc.value);
        }
      }, AUTOSAVE_IDLE_MS);
    };

    desc.addEventListener('input', () => {
      lastInputAt = Date.now();
      scheduleAutosave();
    });

    desc.addEventListener('blur', () => {
      const pendingVal = normalize(desc.value);
      if (pendingVal === lastSavedValue) {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        desc.classList.remove('saving');
        return;
      }
      const elapsed = Date.now() - lastInputAt;
      const waitMore = Math.max(0, MIN_IDLE_ON_BLUR_MS - elapsed);
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      setTimeout(() => {
        if (normalize(desc.value) !== lastSavedValue) {
          saveDescription(desc.value);
        }
      }, waitMore);
    });

    genBtn.addEventListener('click', async () => {
      try {
        genBtn.disabled = true;
        const prev = genBtn.textContent;
        genBtn.textContent = 'Generating…';

        const body = {
          storyboardId,
          imageId: it.imageId,
          shotDescription: String(desc.value || '')
        };

        const r = await fetch('/api/storyboard/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to generate');

        const newText = String(j.description || '').trim();
        if (newText) {
          desc.value = newText;
          const ev = new Event('input', { bubbles: true });
          desc.dispatchEvent(ev);
        }
        genBtn.textContent = prev;
      } catch (e) {
        alert(e.message || e);
      } finally {
        genBtn.disabled = false;
      }
    });

    rhs.appendChild(label);
    rhs.appendChild(desc);
    rhs.appendChild(genRow);

    inner.appendChild(media);
    inner.appendChild(rhs);
    card.appendChild(inner);

    const buttons = el('div', 'sb-buttons');
    const bUpscale = el('button', 'btn-small'); bUpscale.textContent = 'Upscale';
    const bVideo   = el('button', 'btn-small'); bVideo.textContent   = 'Generate video';
    const bDelete  = el('button', 'btn-small btn-danger'); bDelete.textContent = 'Delete';

    bUpscale.onclick = () => alert('Upscale — coming soon');
    bVideo.onclick   = () => alert('Generate video — coming soon');

    bDelete.onclick = async () => {
      if (!confirm("Remove this shot from the storyboard?")) return;
      try {
        bDelete.disabled = true;
        const r = await fetch('/api/storyboard/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyboardId, imageId: it.imageId })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to remove');
        if (row && row.parentNode) row.parentNode.removeChild(row);
        const anyLeft = itemsWrap.querySelector('.sb-item');
        if (!anyLeft && empty) empty.style.display = 'block';
      } catch (err) {
        alert(err.message || err);
        bDelete.disabled = false;
      }
    };

    buttons.appendChild(bUpscale);
    buttons.appendChild(bVideo);
    buttons.appendChild(bDelete);

    row.appendChild(rail);
    row.appendChild(card);
    row.appendChild(buttons);

    // Drag-handle-only
    row.draggable = false;
    const enableDrag = () => { row.draggable = true; };
    const disableDrag = () => { row.draggable = false; };
    handle.addEventListener('mousedown', enableDrag);
    handle.addEventListener('touchstart', enableDrag, { passive: true });
    row.addEventListener('dragend', disableDrag);

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

  /* Drag & Drop (container-based) */
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
    return closest.el;
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

    const card = draggingEl.querySelector('.sb-card');
    indicateReordered(card);

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

  /* Load data */
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

      window.__storyboardMeta = { id: storyboardId, description: (j.description || '') };

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
