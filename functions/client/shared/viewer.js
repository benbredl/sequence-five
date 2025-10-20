import { SVG_ADD, SVG_DELETE, SVG_DOWNLOAD } from "./icons.js";
import { MODAL_CSS } from "./modal.css.js";

export const VIEWER_SHARED = `
${/* inject viewer CSS once */""}
${(await import("./viewer.css.js")).VIEWER_CSS_BOOTSTRAP}

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
    a.href = url; a.setAttribute('download','image'); a.target = '_self';
    document.body.appendChild(a); a.click(); a.remove();
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
        if(!document.body.contains(nb)){ back.classList.remove('blurred'); obs.disconnect(); }
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

  actions.appendChild(aDown);
  actions.appendChild(bAdd);
  actions.appendChild(bDel);
  bottombar.appendChild(actions);

  wrap.appendChild(img);
  wrap.appendChild(bottombar);
  back.appendChild(wrap);
  document.body.appendChild(back);

  var prevOverflow = document.body.style.overflow; document.body.style.overflow='hidden';
  function closeViewer(){ if(back.parentNode){ back.parentNode.removeChild(back); document.body.style.overflow=prevOverflow; document.removeEventListener('keydown', onKey); } }
  function onKey(e){ if(e.key==='Escape') closeViewer(); }
  back.addEventListener('click', function(e){ if(e.target===back) closeViewer(); });
  document.addEventListener('keydown', onKey);

  window.__closeViewer = closeViewer;
}
`;
