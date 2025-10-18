// functions/routes/assets.js
import { Router } from "express";
import { MAX_PARALLEL_GENERATIONS } from "../config.js";

const router = Router();

/* ---------- Tiny assets so we don't 404 ---------- */
router.get("/images/app-logo.svg", (_req, res) => {
  res.type("image/svg+xml").send(`
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sequence Five">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#A78BFA"/>
      <stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
    <radialGradient id="g2" cx="50%" cy="0%" r="100%">
      <stop offset="0" stop-color="rgba(255,255,255,.85)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="url(#g1)" />
  <circle cx="164" cy="164" r="58" fill="white" fill-opacity=".15"/>
  <circle cx="348" cy="164" r="58" fill="white" fill-opacity=".22"/>
  <circle cx="348" cy="348" r="58" fill="white" fill-opacity=".18"/>
  <circle cx="164" cy="348" r="58" fill="white" fill-opacity=".10"/>
  <path d="M128 256h256" stroke="white" stroke-opacity=".55" stroke-width="18" stroke-linecap="round"/>
  <path d="M256 128v256" stroke="white" stroke-opacity=".35" stroke-width="18" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="140" fill="url(#g2)" />
</svg>
  `.trim());
});

// Avoid favicon noise
router.get("/favicon.ico", (_req, res) => res.status(204).end());

/* ---------- Modal CSS used by "Add to Storyboard" picker ---------- */
const MODAL_CSS = `
.nb-modal-backdrop{position:fixed;inset:0;background:rgba(6,8,18,.58);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:10002}
.nb-modal{
  width:min(560px,92vw);
  background:rgba(12,15,32,.62);
  backdrop-filter: blur(12px) saturate(120%);
  border:1px solid rgba(71,80,124,.8);
  border-radius:18px;
  box-shadow:0 24px 80px rgba(2,6,23,.65), inset 0 1px 0 rgba(255,255,255,.06);
  padding:16px
}
.nb-modal h3{margin:0 0 10px 0;font-size:18px}
.nb-modal .hint{color:#a1a8be;font-size:12px}
.nb-list{margin-top:10px;max-height:320px;overflow:auto;border:1px solid #2f375a;border-radius:12px}
.nb-row{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #2a3354}
.nb-row:last-child{border-bottom:none}
.nb-pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}
.nb-close{margin-top:12px;display:flex;justify-content:flex-end}
`;

/* ---------- Inline SVGs ---------- */
const SVG_DOWNLOAD = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const SVG_ADD      = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
const SVG_DELETE   = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>`;
const SVG_CLOSE    = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

/* ---------- Shared: fullscreen viewer CSS & helpers ---------- */
function sharedViewerCssJs() {
  const css = `
  (function(){
    if(document.getElementById('viewer-style')) return;
    var css = ""
      + ".viewer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:10000;opacity:0;animation:vbIn .18s ease forwards}"
      + "@keyframes vbIn{to{opacity:1}}"
      + ".viewer-wrap{position:relative;display:inline-block;max-width:92vw;max-height:92vh}"
      + ".viewer-img{max-width:92vw;max-height:92vh;border-radius:18px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06);transition:filter .18s ease;display:block}"
      + ".viewer-backdrop.blurred .viewer-img{filter:blur(10px) brightness(.65)}"
      + ".viewer-bottombar{position:absolute;right:12px;bottom:12px;display:flex;gap:6px;align-items:center}"
      + ".viewer-close{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}"
      + ".viewer-actions{display:flex;gap:6px;align-items:center}"
      + ".icon-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;background:transparent;padding:0;cursor:pointer;transition:transform .06s ease, filter .18s ease;opacity:.95;color:#fff}"
      + ".icon-btn[disabled]{opacity:.5;cursor:not-allowed}"
      + ".icon-btn:hover{filter:brightness(1.08)}"
      + ".icon-btn:active{transform:translateY(1px)}"
      + ".icon-btn svg{width:16px;height:16px;display:block}"
      + ".gal-overlay{position:absolute;left:0;right:0;bottom:0;padding:8px 10px;background:linear-gradient(0deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,0) 100%);display:flex;align-items:center;justify-content:space-between;gap:6px;opacity:0;transform:translateY(8px);transition:opacity .22s ease, transform .22s ease;z-index:3;pointer-events:auto}"
      + ".card-gal:hover .gal-overlay{opacity:1;transform:translateY(0)}"
      + ".gal-meta{font-size:12px;color:#e6e9ff;display:flex;align-items:center;gap:8px}"
      + ".gal-actions{display:flex;gap:6px;align-items:center}"
      + ".gal-actions .icon-btn{color:#e6e9ff}"
      + ".type-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:3px 7px;font-size:11px;font-weight:800;letter-spacing:.2px}";
    var st=document.createElement('style'); st.id='viewer-style'; st.appendChild(document.createTextNode(css)); document.head.appendChild(st);
  })();`;

  const helpers = `
  async function forceDownload(url, suggestedName){
    try{
      const r = await fetch(url, { mode: 'cors' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const blob = await r.blob();
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = suggestedName || ('image-'+Date.now()+'.png');
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(objectUrl); a.remove(); }, 250);
    }catch(_){
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download','image');
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function injectModalCss(){
    if(document.getElementById('nb-modal-style')) return;
    var st=document.createElement('style'); st.id='nb-modal-style';
    st.appendChild(document.createTextNode(${JSON.stringify(MODAL_CSS)}));
    document.head.appendChild(st);
  }

  function openPicker(imageId){
    injectModalCss();
    var backdrop=document.createElement('div'); backdrop.className='nb-modal-backdrop';
    var modal=document.createElement('div'); modal.className='nb-modal';
    var h=document.createElement('h3'); h.appendChild(document.createTextNode('Add to Storyboard')); modal.appendChild(h);
    var p=document.createElement('div'); p.className='hint'; p.appendChild(document.createTextNode('Choose a storyboard to add this image to.')); modal.appendChild(p);
    var list=document.createElement('div'); list.className='nb-list'; list.innerHTML='<div class="hint" style="padding:12px"><span class="spinner"></span> Loading storyboards…</div>'; modal.appendChild(list);
    var closeRow=document.createElement('div'); closeRow.className='nb-close'; var closeBtn=document.createElement('button'); closeBtn.className='nb-pill'; closeBtn.appendChild(document.createTextNode('Close')); closeRow.appendChild(closeBtn); modal.appendChild(closeRow);
    backdrop.appendChild(modal); document.body.appendChild(backdrop);
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop){ if(document.body.contains(backdrop)) document.body.removeChild(backdrop); }});
    closeBtn.addEventListener('click', function(){ if(document.body.contains(backdrop)) document.body.removeChild(backdrop); });

    fetch('/api/storyboards').then(function(r){ return r.json().then(function(j){ return {ok:r.ok, body:j};});}).then(function(x){
      if(!x.ok){ list.innerHTML = '<div class="hint" style="padding:12px">Failed to load</div>'; return; }
      var arr = x.body.storyboards || [];
      if(!arr.length){ list.innerHTML = '<div class="hint" style="padding:12px">You have no storyboards yet.</div>'; return; }
      list.innerHTML='';
      arr.forEach(function(sb){
        var row=document.createElement('div'); row.className='nb-row';
        var left=document.createElement('div');
        var title=document.createElement('div'); title.style.fontWeight='700'; title.appendChild(document.createTextNode(sb.title||'')); left.appendChild(title);
        var desc=document.createElement('div'); desc.className='hint'; desc.appendChild(document.createTextNode(sb.description||'')); left.appendChild(desc);
        var add=document.createElement('button'); add.className='nb-pill'; add.appendChild(document.createTextNode('Add')); add.addEventListener('click', function(){
          add.disabled=true; add.textContent='Adding…';
          fetch('/api/storyboard/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storyboardId:sb.id,imageId:imageId})})
            .then(function(r){return r.json().then(function(j){return {ok:r.ok,body:j};});})
            .then(function(x){ if(!x.ok) throw new Error(x.body.error||'Failed'); add.textContent='Added'; setTimeout(function(){ if(document.body.contains(backdrop)) document.body.removeChild(backdrop); }, 450); })
            .catch(function(e){ alert(e.message||e); add.disabled=false; add.textContent='Add'; });
        });
        row.appendChild(left); row.appendChild(add); list.appendChild(row);
      });
    }).catch(function(){ list.innerHTML = '<div class="hint" style="padding:12px">Error loading</div>'; });

    return backdrop;
  }

  function openViewerWithActions(opts){
    opts = opts || {};
    var url = opts.url;
    var imageId = opts.imageId || null;
    var onDeleted = typeof opts.onDeleted === 'function' ? opts.onDeleted : null;

    var back = document.createElement('div'); back.className = 'viewer-backdrop';
    var wrap = document.createElement('div'); wrap.className = 'viewer-wrap';
    var img = document.createElement('img'); img.className = 'viewer-img'; img.alt='preview'; img.decoding='async'; img.src = url;

    var bottombar = document.createElement('div'); bottombar.className='viewer-bottombar';
    var actions = document.createElement('div'); actions.className='viewer-actions';

    var aDown = document.createElement('button'); aDown.className='icon-btn'; aDown.title='Download'; aDown.innerHTML = ${JSON.stringify(SVG_DOWNLOAD)};
    aDown.addEventListener('click', function(e){ e.stopPropagation(); forceDownload(url); });

    var bAdd = document.createElement('button'); bAdd.className='icon-btn'; bAdd.title = imageId ? 'Add to Storyboard' : 'Add to Storyboard (image not saved yet)'; bAdd.innerHTML = ${JSON.stringify(SVG_ADD)};
    if(imageId){
      bAdd.addEventListener('click', function(e){
        e.stopPropagation();
        back.classList.add('blurred');
        var nb = openPicker(imageId);
        var obs = new MutationObserver(function(){
          if(!document.body.contains(nb)){
            back.classList.remove('blurred');
            obs.disconnect();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      });
    } else { bAdd.disabled = true; }

    var bDel = document.createElement('button'); bDel.className='icon-btn'; bDel.title = imageId ? 'Delete' : 'Delete (image not saved yet)'; bDel.innerHTML = ${JSON.stringify(SVG_DELETE)};
    if(imageId){
      bDel.addEventListener('click', async function(e){
        e.stopPropagation();
        if(!confirm('Delete this image everywhere? This cannot be undone.')) return;
        bDel.disabled = true;
        try{
          var r = await fetch('/api/image/delete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageId }) });
          var j = await r.json(); if(!r.ok) throw new Error(j.error || 'Failed');
          if(onDeleted) onDeleted();
          closeViewer();
        }catch(err){ alert(err.message||err); bDel.disabled = false; }
      });
    } else { bDel.disabled = true; }

    var close = document.createElement('button'); close.className='viewer-close'; close.innerHTML = ${JSON.stringify(SVG_CLOSE)};

    actions.appendChild(aDown);
    actions.appendChild(bAdd);
    actions.appendChild(bDel);
    bottombar.appendChild(actions);
    bottombar.appendChild(close);

    wrap.appendChild(img);
    wrap.appendChild(bottombar);
    back.appendChild(wrap);
    document.body.appendChild(back);

    var prevOverflow = document.body.style.overflow; document.body.style.overflow='hidden';
    function closeViewer(){ if(back.parentNode){ back.parentNode.removeChild(back); document.body.style.overflow=prevOverflow; document.removeEventListener('keydown', onKey); } }
    function onKey(e){ if(e.key==='Escape') closeViewer(); }
    back.addEventListener('click', function(e){ if(e.target===back) closeViewer(); });
    close.addEventListener('click', closeViewer);
    document.addEventListener('keydown', onKey);

    window.__closeViewer = closeViewer;
  }`;

  return { css, helpers };
}

/* ============================ ARCHIVE / GALLERY ============================ */
router.get("/assets/gallery.js", (_req, res) => {
  const shared = sharedViewerCssJs();
  res.type("application/javascript").send(`(function(){
    function byId(id){ return document.getElementById(id); }

    ${shared.css}
    ${shared.helpers}

    var grid = null, nextCursor = null, loading = false, ended = false;

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var img = entry.target;
          var full = img.getAttribute('data-full');
          var thumb = img.getAttribute('data-thumb');
          if(thumb && full){
            img.srcset = thumb + ' 480w, ' + full + ' 1600w';
            img.sizes = '(min-width: 1400px) 25vw, (min-width: 900px) 33vw, 50vw';
          }
          var hi = new Image(); hi.decoding='async';
          hi.onload=function(){ img.src = full || thumb; img.classList.add('is-loaded'); };
          hi.src = full || thumb;
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    function blurUpPrepare(imgEl, tinySrc, thumbSrc, fullSrc, eager){
      if(tinySrc){ imgEl.classList.add('blur-up'); imgEl.src = tinySrc; }
      else if(thumbSrc){ imgEl.src = thumbSrc; }
      imgEl.setAttribute('data-thumb', thumbSrc || '');
      imgEl.setAttribute('data-full', fullSrc || '');
      if(eager){
        imgEl.setAttribute('loading','eager'); imgEl.setAttribute('fetchpriority','high'); imgEl.decoding='async';
        var hi=new Image(); hi.decoding='async';
        hi.onload=function(){ imgEl.src=fullSrc||thumbSrc; imgEl.classList.add('is-loaded'); };
        hi.src=fullSrc||thumbSrc;
      }else{
        imgEl.setAttribute('loading','lazy'); imgEl.setAttribute('decoding','async'); imgEl.setAttribute('fetchpriority','low'); io.observe(imgEl);
      }
    }

    function buildCard(item, idx){
      var card = document.createElement('div'); card.className='card-gal';

      var media = document.createElement('div'); media.className='media';
      media.style.position='relative';
      media.style.aspectRatio='16 / 9';
      media.style.overflow='hidden';

      var img = document.createElement('img'); img.alt='generated image';
      img.style.position='absolute'; img.style.inset='0'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.cursor='zoom-in';
      var tiny = item.tinyUrl || ''; var thumb = item.thumbUrl || item.url || ''; var full = item.url || '';
      blurUpPrepare(img, tiny, thumb, full, idx < 6);
      img.addEventListener('click', function(){
        openViewerWithActions({
          url: full || thumb,
          imageId: item.id,
          onDeleted: function(){ resetAndLoad(); }
        });
      });
      media.appendChild(img);

      var overlay = document.createElement('div'); overlay.className = 'gal-overlay';
      var meta = document.createElement('div'); meta.className='gal-meta';
      var dt = document.createElement('span'); dt.textContent = (item.createdAt ? new Date(item.createdAt).toLocaleString() : '');
      meta.appendChild(dt);
      var pill = document.createElement('span'); pill.className='type-pill'; pill.textContent = (item.type || '').toString() || '—';
      meta.appendChild(pill);

      var actions = document.createElement('div'); actions.className='gal-actions';

      var btnDownload = document.createElement('button'); btnDownload.className='icon-btn'; btnDownload.title='Download'; btnDownload.innerHTML = ${JSON.stringify(SVG_DOWNLOAD)};
      btnDownload.addEventListener('click', function(e){ e.stopPropagation(); forceDownload(full || thumb); });

      var btnAdd = document.createElement('button'); btnAdd.className='icon-btn'; btnAdd.title='Add to Storyboard'; btnAdd.innerHTML = ${JSON.stringify(SVG_ADD)};
      btnAdd.addEventListener('click', function(e){ e.stopPropagation(); openPicker(item.id); });

      var btnDel = document.createElement('button'); btnDel.className='icon-btn'; btnDel.title='Delete'; btnDel.innerHTML = ${JSON.stringify(SVG_DELETE)};
      btnDel.addEventListener('click', async function(e){
        e.stopPropagation();
        if(!confirm('Delete this image everywhere? This cannot be undone.')) return;
        btnDel.disabled = true;
        try{
          var r = await fetch('/api/image/delete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageId: item.id }) });
          var j = await r.json(); if(!r.ok) throw new Error(j.error || 'Failed');
          card.remove();
        }catch(err){ alert(err.message || err); btnDel.disabled = false; }
      });

      actions.appendChild(btnDownload);
      actions.appendChild(btnAdd);
      actions.appendChild(btnDel);

      overlay.appendChild(meta);
      overlay.appendChild(actions);
      overlay.addEventListener('click', function(e){ e.stopPropagation(); });

      media.appendChild(overlay);
      card.appendChild(media);
      return card;
    }

    async function fetchPage(cursor){
      const qs = new URLSearchParams({ limit: '24' });
      if(cursor) qs.set('cursor', cursor);
      const r = await fetch('/api/gallery?' + qs.toString());
      const j = await r.json();
      if(!r.ok) throw new Error(j.error || 'Failed to load gallery');
      return j;
    }

    async function loadMore(){
      if(loading || ended) return;
      loading = true;
      try{
        const data = await fetchPage(nextCursor);
        const items = data.items || [];
        if(!items.length){
          ended = true;
          return;
        }
        const frag = document.createDocumentFragment();
        const currentCount = grid.children.length;
        for (let i=0;i<items.length;i++){
          frag.appendChild(buildCard(items[i], currentCount + i));
        }
        grid.appendChild(frag);
        nextCursor = data.nextCursor || null;
        if(!nextCursor) ended = true;
        byId('empty').style.display = grid.children.length ? 'none' : 'block';
      }catch(e){
        console.error(e);
      }finally{
        loading = false;
      }
    }

    function resetAndLoad(){
      grid.innerHTML = '';
      nextCursor = null; ended = false; loading = false;
      byId('empty').style.display = 'none';
      loadMore();
    }

    function setUpInfiniteScroll(){
      const sentinel = byId('sentinel');
      if(!sentinel) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((en)=>{
          if(en.isIntersecting) loadMore();
        });
      }, { rootMargin: '800px 0px' });
      observer.observe(sentinel);
    }

    grid = byId('grid');
    if(!grid) return;
    const refresh = byId('refresh');
    if(refresh) refresh.addEventListener('click', resetAndLoad);

    resetAndLoad();
    setUpInfiniteScroll();
  })();`);
});

/* ======================= UNIFIED GENERATOR (generator.js) ======================= */
router.get("/assets/generator.js", (_req, res) => {
  const MAX = Number(MAX_PARALLEL_GENERATIONS || 5);
  const shared = sharedViewerCssJs();
  res.type("application/javascript").send(`(function(){
    function g(id){ return document.getElementById(id); }

    ${shared.css}
    ${shared.helpers}

    var active = 0, limit = ${MAX};
    var dataUrl = null; // base image data URL (no auto-orient)
    var rawFile = null;

    // Elements
    var drop = g('drop'), fileInput = g('file'), dropInner = g('dropInner');
    var metaLine = g('uploadMeta'), removeBtn = g('removeUpload');
    var promptEl = g('prompt'), btnGen = g('generate'), btnEnh = g('enhance');
    var results = g('resultsGrid'), emptyLbl = g('empty');
    var inprogEl = g('inprog'), limitEl = g('limit');

    if(limitEl) limitEl.textContent = String(limit);
    function setInprog(n){ if(inprogEl) inprogEl.textContent = String(n); }
    setInprog(active);

    function updateBtn(){
      if(!btnGen) return;
      if(active >= limit){
        if(!btnGen.disabled){ btnGen.dataset._label = btnGen.textContent; }
        btnGen.disabled = true; btnGen.title = 'Max parallel reached';
        btnGen.textContent = 'Generate (max reached)'; btnGen.setAttribute('aria-disabled','true');
      } else {
        btnGen.disabled = false; btnGen.title = '';
        btnGen.textContent = btnGen.dataset._label || 'Generate'; btnGen.removeAttribute('aria-disabled');
      }
    }
    updateBtn();

    function setEnhEnabled(enabled){
      if(!btnEnh) return;
      btnEnh.disabled = !enabled;
      btnEnh.title = enabled ? '' : 'Disabled when a base image is attached';
    }

    /* ===== Upload helpers (NO auto-orient) ===== */
    function setMeta(text, kind){
      if(!metaLine) return;
      metaLine.textContent = text || '';
      metaLine.style.color = kind === 'error' ? '#ffb4b4' : '#a1a8be';
    }
    function showProcessing(state, label){
      if(!dropInner) return;
      var proc = dropInner.querySelector('.processing');
      if(state){
        if(!proc){
          proc = document.createElement('div');
          proc.className = 'processing';
          proc.innerHTML = '<div class="spinner-lg"></div><span class="hint"></span>';
          dropInner.appendChild(proc);
        }
        proc.querySelector('.hint').textContent = label || 'Processing image…';
      } else if(proc){ proc.remove(); }
    }
    function clearPreview(){
      dataUrl = null; rawFile = null; setMeta(''); showProcessing(false);
      if(dropInner){ dropInner.innerHTML = '<div class="circle">🖼️</div><div>Upload base image (optional)</div>'; }
      if(removeBtn) removeBtn.style.display = 'none';
      var prev = drop ? drop.querySelector('img.preview') : null;
      if(prev && prev.parentNode) prev.parentNode.removeChild(prev);
      setEnhEnabled(true); // re-enable enhancer
    }
    function setPreview(url){
      if(!drop) return;
      if(dropInner) dropInner.innerHTML = '';
      var img = drop.querySelector('img.preview');
      if(!img){
        img = document.createElement('img'); img.className='preview'; img.alt='base image';
        img.style.position='absolute'; img.style.inset='0';
        img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover';
        img.decoding='async'; drop.appendChild(img);
      }
      img.src = url;
      if(removeBtn) removeBtn.style.display = 'inline-flex';
      setEnhEnabled(false); // disable enhancer when we have an image
    }
    function loadImageURL(url){
      return new Promise(function(resolve, reject){
        var img = new Image();
        img.onload = function(){ resolve(img); };
        img.onerror = reject;
        img.src = url; // No EXIF/auto-orient correction
      });
    }
    async function transcodeToDataURL(file, opts){
      var maxDim = (opts && opts.maxDim) || 1536;
      var quality = (opts && opts.quality) || 0.9;
      try{
        showProcessing(true, 'Optimizing…');
        var objURL = URL.createObjectURL(file);
        var bmp = await loadImageURL(objURL);
        var w = bmp.naturalWidth, h = bmp.naturalHeight;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var outW = Math.max(1, Math.round(w * scale)), outH = Math.max(1, Math.round(h * scale));
        var c = document.createElement('canvas'); c.width = outW; c.height = outH;
        var ctx = c.getContext('2d', { alpha:false, desynchronized:true });
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,outW,outH);
        ctx.drawImage(bmp, 0, 0, outW, outH);
        // Prefer webp if available, else jpeg
        var tryWebp = c.toDataURL('image/webp');
        var useWebp = (typeof tryWebp === 'string') && tryWebp.indexOf('data:image/webp') === 0;
        var mime = useWebp ? 'image/webp' : 'image/jpeg';
        var dataURL = c.toDataURL(mime, quality);
        URL.revokeObjectURL(objURL);
        showProcessing(false);
        return { dataURL: dataURL, outW: outW, outH: outH, mime: mime };
      }catch(e){ showProcessing(false); throw e; }
    }
    function friendlyBytes(n){
      if(!Number.isFinite(n)) return '';
      if(n < 1024) return n + ' B';
      if(n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
      return (n/1024/1024).toFixed(2) + ' MB';
    }
    async function handleOptimizedFile(file){
      var type = (file && file.type) || '';
      var ok = /^(image\\/)(jpeg|png|webp|gif|heic|heif)/i.test(type);
      if(!ok){ setMeta('Unsupported file type. Please use JPG, PNG, WEBP or GIF.', 'error'); return clearPreview(); }
      if(file.size > 25 * 1024 * 1024){ setMeta('File too large (max 25MB).', 'error'); return clearPreview(); }
      rawFile = file; setMeta('Reading image…');
      try{
        var before = file.size;
        var out = await transcodeToDataURL(file, { maxDim: 1536, quality: 0.9 });
        dataUrl = out.dataURL; setPreview(out.dataURL);
        var afterBytes = Math.ceil((out.dataURL.length * 3) / 4);
        var saved = Math.max(0, before - afterBytes);
        setMeta('Ready • ' + out.outW + '×' + out.outH + ' • ' + friendlyBytes(afterBytes) + ' (' + friendlyBytes(saved) + ' saved)');
      }catch(e){ setMeta('Failed to process image.', 'error'); clearPreview(); console.error(e); }
    }

    // Hide the native file input to prevent it blocking clicks and to avoid double dialog
    if(fileInput){ fileInput.style.display = 'none'; }

    // Make the whole drop area open the file dialog (single source of truth)
    if(drop){
      drop.tabIndex = 0; drop.setAttribute('role','button'); drop.setAttribute('aria-label','Upload base image');
      drop.addEventListener('click', function(e){
        if(fileInput){ fileInput.click(); }
      });
      drop.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          if(fileInput){ fileInput.click(); }
        }
      });
      // Drag & drop
      ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('is-drag'); }); });
      ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('is-drag'); }); });
      drop.addEventListener('drop', function(e){ var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleOptimizedFile(f); });
    }

    // File input change handler (single path)
    if(fileInput){
      fileInput.addEventListener('change', function(){
        var f = this.files && this.files[0];
        if(f) handleOptimizedFile(f);
      });
    }

    // Paste support
    document.addEventListener('paste', function(e){
      if(!drop) return;
      var items = e.clipboardData && e.clipboardData.items; if(!items) return;
      for(var i=0;i<items.length;i++){ var it = items[i]; if(it.kind === 'file'){ var f = it.getAsFile(); if(f && /^image\\//i.test(f.type)){ handleOptimizedFile(f); break; } } }
    });

    if(removeBtn){ removeBtn.addEventListener('click', function(e){ e.stopPropagation(); clearPreview(); }); removeBtn.style.display = 'none'; }

    /* ===== Results & generation ===== */
    function addResultCard(){
      if(emptyLbl) emptyLbl.style.display='none';
      if(!results) return null;
      var card = document.createElement('div'); card.className='result-card';
      var media = document.createElement('div'); media.className='result-media';
      media.style.aspectRatio = '16 / 9'; // keep 16:9 box
      var skel = document.createElement('div'); skel.className='skeleton';
      var spinner = document.createElement('div'); spinner.className='spinner-lg';
      skel.appendChild(spinner); media.appendChild(skel);
      var img = document.createElement('img'); img.alt='generated image'; img.style.display='none';
      media.appendChild(img);
      card.appendChild(media); results.prepend(card);
      return { card: card, media: media, img: img, skel: skel };
    }

    async function enhancePrompt(seed){
      try{
        var r = await fetch('/api/enhance/stream', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: seed }) });
        if(!r.ok || !r.body){
          var alt = await fetch('/api/enhance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: seed }) });
          var jj = await alt.json().catch(function(){ return {}; });
          if(alt.ok && jj.enhancedPrompt) return jj.enhancedPrompt;
          throw new Error(jj.error || 'Enhance failed');
        }
        var text = await r.text();
        var parts = text.split("\\n\\n").map(function(s){ return s.trim(); }).filter(function(s){ return s.length; });
        for(var i=parts.length-1;i>=0;i--){
          var l = parts[i];
          if(l.indexOf('data:') === 0){
            var jsonStr = l.slice(5).trim();
            try{
              var obj = JSON.parse(jsonStr);
              if(obj && typeof obj.output_text === 'string') return obj.output_text;
            }catch(_){}
          }
        }
        throw new Error('No enhance text');
      }catch(e){ throw e; }
    }

    async function callGenerate(opts){
      var prompt = opts.prompt; var baseImage = opts.baseImage;
      try{
        var r = await fetch('/api/generate-image', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: prompt, image: baseImage ? { dataUrl: baseImage } : null }) });
        var j = await r.json().catch(function(){ return {}; });
        if(!r.ok) throw new Error(j.error || 'Generate failed');
        return j;
      }catch(e){
        // Fallback to legacy endpoints
        if(baseImage){
          var r1 = await fetch('/api/img2img', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: prompt, image: { dataUrl: baseImage } }) });
          var j1 = await r1.json().catch(function(){ return {}; });
          if(!r1.ok) throw new Error(j1.error || 'Generate (img2img) failed');
          return j1;
        } else {
          var r2 = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: prompt, enhancedPrompt: prompt }) });
          var j2 = await r2.json().catch(function(){ return {}; });
          if(!r2.ok) throw new Error(j2.error || 'Generate (t2i) failed');
          return j2;
        }
      }
    }

    if(btnEnh && promptEl){
      btnEnh.addEventListener('click', async function(){
        if(btnEnh.disabled) return;
        var seed = (promptEl.value || '').trim();
        if(!seed){ alert('Please enter a prompt to enhance.'); return; }
        btnEnh.disabled = true; var old = btnEnh.textContent; btnEnh.textContent = 'Enhancing…';
        try{
          var enhanced = await enhancePrompt(seed);
          promptEl.value = enhanced || seed;
        }catch(e){ alert(e.message || e); }
        finally{ setEnhEnabled(!dataUrl); btnEnh.textContent = old; }
      });
    }

    if(btnGen && promptEl){
      btnGen.addEventListener('click', function(){
        if(active >= limit) return;
        var p = (promptEl.value || '').trim();
        if(!p){ alert('Please enter a prompt.'); return; }
        active++; setInprog(active); updateBtn();
        var ui = addResultCard();
        (async function(){
          try{
            var res = await callGenerate({ prompt: p, baseImage: dataUrl });
            if(!ui) return;
            if(res && res.imageBase64 && res.mimeType){
              var url = 'data:' + res.mimeType + ';base64,' + res.imageBase64;
              ui.img.style.display = 'block'; ui.img.src = url; ui.img.dataset.imageId = res.id || '';
              if(ui.skel && ui.skel.parentNode) ui.skel.parentNode.removeChild(ui.skel);
              ui.img.style.cursor = 'zoom-in';
              ui.img.addEventListener('click', function(){
                openViewerWithActions({
                  url: url,
                  imageId: res.id || null,
                  onDeleted: function(){
                    var cardEl = ui.img.closest('.result-card');
                    if(cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
                  }
                });
              });
            } else {
              if(ui.skel) ui.skel.innerHTML = '<span class="hint">No image returned.</span>';
            }
          }catch(e){
            if(ui && ui.skel) ui.skel.innerHTML = '<span class="hint">Error: ' + (e.message||e) + '</span>';
          }finally{
            active--; setInprog(active); updateBtn();
          }
        })();
      });
    }

    clearPreview();
  })();`);
});

/* dashboard placeholder */
router.get("/assets/dashboard.js", (_req, res) => {
  res.type("application/javascript").send(`(function(){ /* dashboard placeholder */ })();`);
});

export default router;
