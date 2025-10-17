import { Router } from "express";
import { MAX_PARALLEL_GENERATIONS } from "../config.js";

const router = Router();

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

/* ---------- Inline SVGs (small, consistent) ---------- */
const SVG_DOWNLOAD = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const SVG_ADD      = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
const SVG_DELETE   = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>`;
const SVG_CLOSE    = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

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

/* ============================ GALLERY ============================ */
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
            img.sizes = '(min-width: 1200px) 25vw, (min-width: 800px) 33vw, 50vw';
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
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((en)=>{
          if(en.isIntersecting) loadMore();
        });
      }, { rootMargin: '800px 0px' });
      observer.observe(sentinel);
    }

    byId('refresh').addEventListener('click', resetAndLoad);

    grid = byId('grid');
    resetAndLoad();
    setUpInfiniteScroll();
  })();`);
});

/* ======================= GENERATORS (shared CSS/JS) ======================= */
function generatorSharedCssJs() { return sharedViewerCssJs(); }

/* -------- Text-to-Image client script (don’t send temp/limits) -------- */
router.get("/assets/text2img.js", (_req, res) => {
  const MAX = Number(MAX_PARALLEL_GENERATIONS || 5);
  const shared = generatorSharedCssJs();
  res.type("application/javascript").send(`(function(){
    function g(id){ return document.getElementById(id); }
    var PIXEL='data:image/gif;base64,R0lGODlhAQABAAAAACw=';

    ${shared.css}
    ${shared.helpers}

    var active=0, limit=${MAX};
    if(g('limit')) g('limit').textContent = String(limit);
    function setInprog(n){ if(g('inprog')) g('inprog').textContent = String(n); }

    function updateBtn(){
      var b=g('generate'); if(!b) return;
      if(active>=limit){
        if(!b.disabled){ b.dataset._label = b.textContent; }
        b.disabled = true; b.title = 'Max parallel reached';
        b.textContent = 'Generate (max reached)'; b.setAttribute('aria-disabled','true');
      } else {
        b.disabled = false; b.title = '';
        b.textContent = b.dataset._label || 'Generate'; b.removeAttribute('aria-disabled');
      }
    }
    updateBtn(); setInprog(active);

    function addTile(){
      g('empty').style.display='none';
      var card=document.createElement('div'); card.className='card-gal';
      var media=document.createElement('div'); media.className='media'; media.style.position='relative'; media.style.aspectRatio='16/9'; media.style.overflow='hidden';
      var img=document.createElement('img'); img.alt=''; img.src=PIXEL; img.style.position='absolute'; img.style.inset='0'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.cursor='zoom-in';
      img.addEventListener('click', function(){ if(img.src && img.src!==PIXEL) openViewerWithActions({ url: img.src, imageId: img.dataset.imageId || null, onDeleted: function(){ var cardEl = img.closest('.card-gal'); if(cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl); } }); });
      media.appendChild(img);

      var overlay=document.createElement('div'); overlay.className='gal-overlay';
      var meta=document.createElement('div'); meta.className='gal-meta';
      var ts=document.createElement('span'); ts.textContent=new Date().toLocaleString(); meta.appendChild(ts);
      var pill=document.createElement('span'); pill.className='type-pill'; pill.textContent='T2I'; meta.appendChild(pill);

      var actions=document.createElement('div'); actions.className='gal-actions';
      var btnDownload=document.createElement('button'); btnDownload.className='icon-btn'; btnDownload.title='Download'; btnDownload.innerHTML=${JSON.stringify(SVG_DOWNLOAD)};
      btnDownload.addEventListener('click', function(e){ e.stopPropagation(); if(img.src && img.src!==PIXEL) forceDownload(img.src); });
      var btnAdd=document.createElement('button'); btnAdd.className='icon-btn'; btnAdd.title='Add to Storyboard'; btnAdd.disabled=true; btnAdd.innerHTML=${JSON.stringify(SVG_ADD)};
      var btnDel=document.createElement('button'); btnDel.className='icon-btn'; btnDel.title='Delete'; btnDel.disabled=true; btnDel.innerHTML=${JSON.stringify(SVG_DELETE)};
      actions.appendChild(btnDownload); actions.appendChild(btnAdd); actions.appendChild(btnDel);

      overlay.appendChild(meta); overlay.appendChild(actions);
      media.appendChild(overlay);

      card.appendChild(media);
      var loading=document.createElement('div'); loading.className='loadingState'; loading.innerHTML='<span class="hint"><span class="spinner"></span> Generating …</span>'; card.appendChild(loading);

      g('resultsGrid').prepend(card);

      return { img, loading, btnDownload, btnAdd, btnDel };
    }

    // Streaming enhancer — no temperature / max token params sent anymore
    async function streamEnhance(){
      var btn=g('enhance'); var area=g('prompt');
      var original = area.value;
      var seed = (original || "").trim();
      if(!seed){ alert('Please enter a prompt to enhance.'); return; }

      btn.disabled=true; btn.classList.add('is-busy');
      var old=btn.textContent; btn.textContent='Enhancing …';

      var received = false;

      async function fallbackNonStream(){
        try{
          const rr = await fetch('/api/enhance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:seed})});
          const jj = await rr.json().catch(()=>({}));
          if(rr.ok && jj.enhancedPrompt){
            area.value = jj.enhancedPrompt;
            return true;
          }
          if(jj && jj.error){
            alert('Enhance error: ' + jj.error + (jj.code ? ' ['+jj.code+']' : ''));
          } else {
            alert('Enhance failed (non-stream).');
          }
          return false;
        }catch(e){
          alert('Enhance failed: ' + (e.message||e));
          return false;
        }
      }

      function normalizeNewlines(s){ return s.split('\\r\\n').join('\\n').split('\\r').join('\\n'); }
      function extractEvents(bufferStr){
        var out = []; var idx = bufferStr.indexOf('\\n\\n');
        while (idx !== -1){ out.push(bufferStr.slice(0, idx)); bufferStr = bufferStr.slice(idx + 2); idx = bufferStr.indexOf('\\n\\n'); }
        return { events: out, rest: bufferStr };
      }

      try{
        const r = await fetch('/api/enhance/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: seed }) // <-- no temp/max
        });

        if(!r.ok || !r.body){
          const ok = await fallbackNonStream();
          if(!ok) area.value = original;
          return;
        }

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        var buffer = "";

        let done = false;
        while(!done){
          const info = await reader.read();
          done = info.done;
          if(info.value){
            buffer += decoder.decode(info.value, { stream: true });
            buffer = normalizeNewlines(buffer);

            const parts = extractEvents(buffer);
            buffer = parts.rest;

            for(var i=0;i<parts.events.length;i++){
              const evt = parts.events[i];
              const lines = evt.split('\\n');
              let dataLine = null;
              for (var j=0;j<lines.length;j++){
                const ln = lines[j].trim();
                if(ln.indexOf('data:') === 0){ dataLine = ln.slice(5).trim(); }
              }
              if(!dataLine) continue;
              if(dataLine === "[DONE]"){ done = true; break; }

              try{
                const obj = JSON.parse(dataLine);
                if(obj && obj.error){
                  alert('Enhance error: ' + obj.error + (obj.code ? ' ['+obj.code+']' : ''));
                  done = true; break;
                }
                let piece = "";
                if (typeof obj.delta === "string") piece = obj.delta;
                else if (typeof obj.output_text === "string") piece = obj.output_text;
                else if (obj && obj.output && obj.output[0] && obj.output[0].content && obj.output[0].content[0] && typeof obj.output[0].content[0].text === "string") piece = obj.output[0].content[0].text;

                if (piece){
                  if(!received){ received = true; area.value = ""; }
                  area.value += piece;
                }
              } catch(_e) { /* keepalive line */ }
            }
          }
        }

        if(!received){
          const ok = await fallbackNonStream();
          if(!ok) area.value = original;
        }
      }catch(_err){
        const ok = await fallbackNonStream();
        if(!ok) area.value = original;
      }finally{
        btn.disabled=false; btn.classList.remove('is-busy'); btn.textContent=old;
      }
    }

    var enh = g('enhance');
    if(enh){ enh.addEventListener('click', streamEnhance); }

    var gen = g('generate');
    if(gen){
      gen.addEventListener('click', function(){
        if(active>=limit) return;
        var prompt = g('prompt').value.trim(); if(!prompt){ alert('Please enter a prompt.'); return; }
        active++; setInprog(active); updateBtn();

        var ui = addTile();
        (async function(){
          try{
            var r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt, enhancedPrompt:prompt})});
            var j=await r.json(); if(!r.ok) throw new Error(j.error||'Generate failed');
            if(j.imageBase64 && j.mimeType){
              var url='data:'+j.mimeType+';base64,'+j.imageBase64;
              ui.img.src=url; ui.img.dataset.imageId = j.id || "";
              ui.loading.remove();

              if(j.id){
                ui.btnAdd.disabled=false;
                ui.btnAdd.onclick=function(e){ e.stopPropagation(); openPicker(j.id); };
                ui.btnDel.disabled=false;
                ui.btnDel.onclick=async function(e){
                  e.stopPropagation();
                  if(!confirm('Delete this image everywhere? This cannot be undone.')) return;
                  ui.btnDel.disabled=true;
                  try{
                    var rr=await fetch('/api/image/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageId:j.id})});
                    var jj=await rr.json(); if(!rr.ok) throw new Error(jj.error||'Delete failed');
                    var card = ui.img.closest('.card-gal'); if(card && card.parentNode) card.parentNode.removeChild(card);
                  }catch(err){ alert(err.message||err); ui.btnDel.disabled=false; }
                };
              }
            } else {
              ui.loading.innerHTML='<span class="hint">No image returned.</span>';
            }
          }catch(e){
            ui.loading.innerHTML='<span class="hint">Error: '+(e.message||e)+'</span>';
          }finally{
            active--; setInprog(active); updateBtn();
          }
        })();
      });
    }
  })();`);
});

/* -------- Image-to-Image client script -------- */
router.get("/assets/img2img.js", (_req, res) => {
  const MAX = Number(MAX_PARALLEL_GENERATIONS || 5);
  const shared = generatorSharedCssJs();
  res.type("application/javascript").send(`(function(){
    function g(i){return document.getElementById(i);}
    var dataUrl=null;
    var dz=g('dz'), file=g('file');
    var PIXEL='data:image/gif;base64,R0lGODlhAQABAAAAACw=';

    ${shared.css}
    ${shared.helpers}

    function setPreview(url){
      dataUrl=url;
      dz.innerHTML =
        '<input id="file" type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer" />' +
        '<img alt="base" src="'+url+'" />' +
        '<div class="dz-hint"><span class="dz-pill">PNG / JPG</span><span class="dz-pill">16:9 preferred</span></div>';
      file = g('file');
      file.addEventListener('change', onFileChange);
    }
    function onFileChange(){
      var f=this.files&&this.files[0]; if(!f){ dataUrl=null; return; }
      var rd=new FileReader(); rd.onload=function(e){ setPreview(e.target.result); }; rd.readAsDataURL(f);
    }
    file.addEventListener('change', onFileChange);
    ['dragenter','dragover'].forEach(function(ev){
      dz.addEventListener(ev,function(e){ e.preventDefault(); dz.style.borderColor='#3a4680'; });
    });
    ['dragleave','drop'].forEach(function(ev){
      dz.addEventListener(ev,function(e){ e.preventDefault(); dz.style.borderColor='#2a3354'; });
    });
    dz.addEventListener('drop',function(e){
      var f=(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); if(!f) return;
      var rd=new FileReader(); rd.onload=function(ev){ setPreview(ev.target.result); }; rd.readAsDataURL(f);
    });

    var active=0, limit=${MAX};
    if(g('limit')) g('limit').textContent = String(limit);
    function setInprog(n){ if(g('inprog')) g('inprog').textContent = String(n); }
    function updateBtn(){ var b=g('go'); if(!b) return; if(active>=limit){ b.disabled=true; b.title='Max parallel reached'; } else { b.disabled=false; b.title=''; } }
    updateBtn(); setInprog(active);

    function addTile(){
      g('empty').style.display='none';
      var card=document.createElement('div'); card.className='card-gal';
      var media=document.createElement('div'); media.className='media'; media.style.position='relative'; media.style.aspectRatio='16/9'; media.style.overflow='hidden';
      var img=document.createElement('img'); img.alt=''; img.src=PIXEL; img.style.position='absolute'; img.style.inset='0'; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; img.style.cursor='zoom-in';
      img.addEventListener('click', function(){ if(img.src && img.src!==PIXEL) openViewerWithActions({ url: img.src, imageId: img.dataset.imageId || null, onDeleted: function(){ var cardEl = img.closest('.card-gal'); if(cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl); } }); });
      media.appendChild(img);

      var overlay=document.createElement('div'); overlay.className='gal-overlay';
      var meta=document.createElement('div'); meta.className='gal-meta';
      var ts=document.createElement('span'); ts.textContent=new Date().toLocaleString(); meta.appendChild(ts);
      var pill=document.createElement('span'); pill.className='type-pill'; pill.textContent='I2I'; meta.appendChild(pill);

      var actions=document.createElement('div'); actions.className='gal-actions';
      var btnDownload=document.createElement('button'); btnDownload.className='icon-btn'; btnDownload.title='Download'; btnDownload.innerHTML=${JSON.stringify(SVG_DOWNLOAD)};
      btnDownload.addEventListener('click', function(e){ e.stopPropagation(); if(img.src && img.src!==PIXEL) forceDownload(img.src); });
      var btnAdd=document.createElement('button'); btnAdd.className='icon-btn'; btnAdd.title='Add to Storyboard'; btnAdd.disabled=true; btnAdd.innerHTML=${JSON.stringify(SVG_ADD)};
      var btnDel=document.createElement('button'); btnDel.className='icon-btn'; btnDel.title='Delete'; btnDel.disabled=true; btnDel.innerHTML=${JSON.stringify(SVG_DELETE)};
      actions.appendChild(btnDownload); actions.appendChild(btnAdd); actions.appendChild(btnDel);

      overlay.appendChild(meta); overlay.appendChild(actions);
      media.appendChild(overlay);

      card.appendChild(media);

      var loading=document.createElement('div'); loading.className='loadingState'; loading.innerHTML='<span class="hint"><span class="spinner"></span> Generating …</span>'; card.appendChild(loading);

      var grid=document.getElementById('resultsGrid'); grid.prepend(card);

      return { img, loading, btnDownload, btnAdd, btnDel };
    }

    var go = g('go');
    if(go){
      go.addEventListener('click', function(){
        if(active>=limit) return;
        var p=g('prompt').value.trim();
        if(!dataUrl){ alert('Please choose a base image.'); return; }
        if(!p){ alert('Please enter a prompt.'); return; }

        active++; setInprog(active); updateBtn();

        var ui = addTile();
        (async function(){
          try{
            var r=await fetch('/api/img2img',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ prompt: p, image:{ dataUrl: dataUrl } })});
            var j=await r.json(); if(!r.ok) throw new Error(j.error||'Request failed');
            if(j.imageBase64 && j.mimeType){
              var url='data:'+j.mimeType+';base64,'+j.imageBase64;
              ui.img.src=url; ui.img.dataset.imageId = j.id || "";
              ui.loading.remove();

              if(j.id){
                ui.btnAdd.disabled=false;
                ui.btnAdd.onclick=function(e){ e.stopPropagation(); openPicker(j.id); };
                ui.btnDel.disabled=false;
                ui.btnDel.onclick=async function(e){
                  e.stopPropagation();
                  if(!confirm('Delete this image everywhere? This cannot be undone.')) return;
                  ui.btnDel.disabled=true;
                  try{
                    var rr=await fetch('/api/image/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageId:j.id})});
                    var jj=await rr.json(); if(!rr.ok) throw new Error(jj.error||'Delete failed');
                    var card = ui.img.closest('.card-gal'); if(card && card.parentNode) card.parentNode.removeChild(card);
                  }catch(err){ alert(err.message||err); ui.btnDel.disabled=false; }
                };
              }
            } else {
              ui.loading.innerHTML='<span class="hint">No image returned.</span>';
            }
          }catch(e){
            ui.loading.innerHTML='<span class="hint">Error: '+(e.message||e)+'</span>';
          }finally{
            active--; setInprog(active); updateBtn();
          }
        })();
      });
    }
  })();`);
});

/* dashboard placeholder */
router.get("/assets/dashboard.js", (_req, res) => {
  res.type("application/javascript").send(`(function(){ /* dashboard placeholder */ })();`);
});

export default router;
