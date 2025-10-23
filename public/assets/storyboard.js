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

  async function niceConfirm({ title = "Are you sure?", message = "", confirmText = "Delete", cancelText = "Cancel", danger = true } = {}) {
    if (window.NBViewer && typeof NBViewer.open === "function") {
      try {
      } catch {}
    }
    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "nbv-confirm-back";
      const sheet = document.createElement("div");
      sheet.className = "nbv-confirm";
      sheet.innerHTML =
        `<h3>${title}</h3>` +
        `<p>${message}</p>` +
        `<div class="row">` +
        `<button class="nbv-btn">${cancelText}</button>` +
        `<button class="nbv-btn ${danger ? "danger" : ""}">${confirmText}</button>` +
        `</div>`;
      document.body.appendChild(back);
      back.appendChild(sheet);
      const [bCancel, bOk] = sheet.querySelectorAll(".nbv-btn");
      function close(val){ if (back.parentNode) back.parentNode.removeChild(back); resolve(val); }
      back.addEventListener("click", (e) => { if (e.target === back) close(false); });
      bCancel.addEventListener("click", () => close(false));
      bOk.addEventListener("click", () => close(true));
    });
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
    const img = createProgressiveImage({
      tinyUrl: it.tinyUrl || null,
      thumbUrl: it.thumbUrl || it.url || null,
      alt: "storyboard item"
    });
    media.appendChild(img);

    const pill = el('div', 'sb-pill');
    pill.textContent = stateToLabel(it);
    if (String(it.state || '').toLowerCase() === 'upscaled') {
      pill.classList.add('is-upscaled');
    }
    media.appendChild(pill);

    media.addEventListener('click', () => {
      const full = it.url || it.thumbUrl;
      if (!full) return;
      const aspect =
        (img.naturalWidth && img.naturalHeight)
          ? (img.naturalWidth / img.naturalHeight)
          : (img.clientWidth && img.clientHeight ? img.clientWidth / img.clientHeight : null);

      if (window.NBViewer && typeof NBViewer.open === 'function') {
        NBViewer.open(full, {
          imageId: it.imageId,
          createdAt: it.addedAt || undefined,
          state: it.state || 'base-image',
          lowSrc: it.thumbUrl || it.tinyUrl || null,
          aspect: aspect || null,
          // NEW: pass upscaled URL if present so viewer uses it
          upscaledUrl: it.upscaledUrl || null,
          onDeleted: () => {
            if (row && row.parentNode) row.parentNode.removeChild(row);
            showEmptyIfNeeded();
          }
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

    // Disable Upscale if already upscaled
    if (String(it.state || '').toLowerCase() === 'upscaled') {
      bUpscale.disabled = true;
      bUpscale.title = 'Already upscaled';
    }

    // Friendly status loop
    const STATUS_LABELS = {
      PENDING: "Queued…",
      IN_QUEUE: "Queued…",
      IN_PROGRESS: "Upscaling…",
      COMPLETED: "Upscaled",
      FAILED: "Retry Upscale"
    };

    let pollTimer = null;

    async function pollStatus() {
      try {
        const r = await fetch('/api/image/upscale-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: it.imageId })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to get status');

        const status = String(j.status || '').toUpperCase();
        const upscaledUrl = j.upscaledUrl || null;

        bUpscale.textContent = STATUS_LABELS[status] || status;

        if (status === 'COMPLETED') {
          // Promote UI state
          it.state = 'upscaled';
          if (upscaledUrl) it.upscaledUrl = upscaledUrl;
          pill.textContent = stateToLabel(it);
          bUpscale.disabled = true;

          // Keep thumbnail; viewer will use upscaled in fullscreen automatically
          if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
          return;
        }

        if (status === 'FAILED') {
          bUpscale.disabled = false;
          if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
          return;
        }

        // Keep polling
        pollTimer = setTimeout(pollStatus, 3000);
      } catch (e) {
        // Back off on error
        pollTimer = setTimeout(pollStatus, 5000);
      }
    }

    bUpscale.onclick = async () => {
      try {
        bUpscale.disabled = true;
        bUpscale.textContent = "Queueing…";
        const r = await fetch('/api/image/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId: it.imageId })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Failed to start upscaling');

        // Immediately show status and begin polling
        bUpscale.textContent = STATUS_LABELS[String(j.status || 'PENDING').toUpperCase()] || "Queued…";
        pollStatus();
      } catch (e) {
        alert(e.message || e);
        bUpscale.disabled = false;
        bUpscale.textContent = "Upscale";
      }
    };

    bVideo.onclick   = () => alert('Generate video — coming soon');

    bDelete.onclick  = async () => {
      const ok = await niceConfirm({
        title: "Remove from storyboard",
        message: "Remove this image from this storyboard? The original image will remain in your Archive.",
        confirmText: "Remove",
        cancelText: "Cancel",
        danger: true
      });
      if (!ok) return;
      bDelete.disabled = true;
      try {
        const r = await fetch('/api/storyboard/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyboardId, imageId: it.imageId })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Failed to remove');
        if (row && row.parentNode) row.parentNode.removeChild(row);
        showEmptyIfNeeded();
      } catch (e) {
        alert(e.message || e);
        bDelete.disabled = false;
      }
    };

    buttons.appendChild(bUpscale);
    buttons.appendChild(bVideo);
    buttons.appendChild(bDelete);

    row.appendChild(rail);
    row.appendChild(card);
    row.appendChild(buttons);

    return row;
  }

  function showEmptyIfNeeded() {
    if (!itemsWrap) return;
    const has = itemsWrap.children.length > 0;
    if (empty) empty.style.display = has ? "none" : "block";
  }

  async function load() {
    try {
      headCard.innerHTML = "<div class='hint'>Loading…</div>";
      const r = await fetch(`/api/storyboard?id=${encodeURIComponent(storyboardId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load");
      const sb = j || {};

      pageTitle.textContent = sb.title || "Storyboard";
      headCard.innerHTML = `
        <div class="row" style="align-items:center;justify-content:space-between">
          <div><strong>${sb.title || ""}</strong><div class="hint" style="margin-top:6px">${sb.description || ""}</div></div>
        </div>
      `;

      itemsWrap.innerHTML = "";
      const frag = document.createDocumentFragment();
      (sb.items || []).forEach((it) => frag.appendChild(makeItem(it)));
      itemsWrap.appendChild(frag);
      showEmptyIfNeeded();
    } catch (e) {
      headCard.innerHTML = `<div class='hint'>${e.message || e}</div>`;
    }
  }

  let dragEl = null;
  let placeholder = null;

  function onDragStart(e) {
    const handle = e.target.closest('.sb-handle');
    if (!handle) return;
    const row = handle.closest('.sb-item');
    if (!row) return;
    dragEl = row;
    dragEl.classList.add('dragging');
    placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
    row.parentNode.insertBefore(placeholder, row.nextSibling);
    e.preventDefault();
  }

  function onDragOver(e) {
    if (!dragEl) return;
    e.preventDefault();
    const rows = Array.from(itemsWrap.querySelectorAll('.sb-item')).filter(r => r !== dragEl);
    const y = e.clientY;
    let after = null;
    for (const r of rows) {
      const box = r.getBoundingClientRect();
      if (y < box.top + box.height / 2) { after = r; break; }
    }
    if (after) {
      itemsWrap.insertBefore(placeholder, after);
    } else {
      itemsWrap.appendChild(placeholder);
    }
  }

  async function onDragEnd() {
    if (!dragEl) return;
    const after = placeholder.nextElementSibling;
    itemsWrap.insertBefore(dragEl, after);
    placeholder.parentNode.removeChild(placeholder);
    placeholder = null;
    dragEl.classList.remove('dragging');

    const rows = Array.from(itemsWrap.querySelectorAll('.sb-item'));
    rows.forEach((r, i) => r.dataset.orderIndex = String((i + 1) * GAP));

    const newIndex = Number(dragEl.dataset.orderIndex || 0);
    const imageId = dragEl.dataset.imageId;

    try {
      const r = await fetch('/api/storyboard/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboardId, imageId, newOrderIndex: newIndex })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      indicateReordered(dragEl.querySelector('.sb-card'));
    } catch (e) {
      console.error('[reorder] failed', e);
    } finally {
      dragEl = null;
    }
  }

  itemsWrap.addEventListener('mousedown', onDragStart);
  itemsWrap.addEventListener('mousemove', onDragOver);
  document.addEventListener('mouseup', onDragEnd);

  load();
})();
