/* functions/client/storyboard.js
   Client bundle for /storyboard?id=...
   - Loads storyboard meta + items
   - Renders vertical timeline of items
   - Per-item actions: open fullscreen, remove from storyboard
*/

(function () {
  const $ = (id) => document.getElementById(id);
  const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };

  // Ensure viewer exists
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

  const head = $('head');
  const itemsWrap = $('itemsWrap');
  const empty = $('empty');

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

    const media = el('div', 'sb-media');
    const img = new Image();
    img.alt = 'storyboard item';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = it.thumbUrl || it.url;
    img.className = 'blur-up';
    img.addEventListener('load', () => img.classList.add('is-loaded'));
    img.addEventListener('click', () => window.NBViewer.openViewerWithActions({ url: it.url, imageId: it.imageId }));
    media.appendChild(img);

    const right = el('div');
    const meta = el('div'); meta.className = 'hint';
    try {
      const dt = it.addedAt ? new Date(it.addedAt) : null;
      meta.textContent = (dt ? dt.toLocaleString() : '') + (it.modelUsed ? ' • ' + it.modelUsed : '');
    } catch { meta.textContent = it.modelUsed || ''; }

    const actions = el('div', 'sb-actions');
    const bOpen = el('button', 'pill'); bOpen.textContent = 'Open';
    bOpen.onclick = () => window.NBViewer.openViewerWithActions({ url: it.url, imageId: it.imageId });

    const bRemove = el('button', 'pill'); bRemove.textContent = 'Remove from storyboard';
    bRemove.onclick = async () => {
      if (!confirm('Remove this image from the storyboard?')) return;
      bRemove.disabled = true;
      try {
        const r = await fetch('/api/storyboard/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyboardId, imageId: it.imageId })
        });
        const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Failed');
        row.remove();
        if (!itemsWrap.firstChild) empty.style.display = 'block';
      } catch (e) {
        alert(e.message || e);
        bRemove.disabled = false;
      }
    };

    actions.appendChild(bOpen);
    actions.appendChild(bRemove);

    right.appendChild(meta);
    right.appendChild(actions);

    inner.appendChild(media);
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

      head.innerHTML = '';
      const title = el('div'); title.style.fontWeight = '700'; title.textContent = j.title || '(Untitled storyboard)';
      const desc = el('div'); desc.className = 'hint'; desc.textContent = j.description || '';
      head.appendChild(title); head.appendChild(desc);

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
