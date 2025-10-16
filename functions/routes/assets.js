import { Router } from "express";

const router = Router();

/* ---------- Modal CSS used by gallery picker ---------- */
const MODAL_CSS = `
.nb-modal-backdrop{position:fixed;inset:0;background:rgba(4,6,18,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999}
.nb-modal{width:min(520px,92vw);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));border:1px solid #252b46;border-radius:18px;box-shadow:0 18px 60px rgba(2,6,23,.55),inset 0 1px 0 rgba(255,255,255,.04);padding:16px}
.nb-modal h3{margin:0 0 10px 0;font-size:18px}
.nb-modal .hint{color:#a1a8be;font-size:12px}
.nb-list{margin-top:10px;max-height:320px;overflow:auto;border:1px solid #2f375a;border-radius:12px}
.nb-row{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #2a3354}
.nb-row:last-child{border-bottom:none}
.nb-pill{display:inline-flex;gap:6px;align-items:center;border-radius:999px;border:1px solid #2f375a;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));color:#c7ceed;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}
.nb-close{margin-top:12px;display:flex;justify-content:flex-end}
`;

/* ---------- Gallery page JS (with Add to Storyboard modal) ---------- */
router.get("/assets/gallery.js", (_req, res) => {
  res.type("application/javascript").send(`(function(){
    function byId(id){ return document.getElementById(id); }
    function txt(s){ return document.createTextNode(s==null?'':String(s)); }
    function injectModalCss(){ if(document.getElementById('nb-modal-style')) return; var st=document.createElement('style'); st.id='nb-modal-style'; st.appendChild(document.createTextNode(${JSON.stringify(MODAL_CSS)})); document.head.appendChild(st); }

    function blurUp(imgEl, tinySrc, fullSrc){
      if (!tinySrc || tinySrc === fullSrc) { imgEl.src = fullSrc; imgEl.classList.add('is-loaded'); return; }
      imgEl.classList.add('blur-up'); imgEl.src = tinySrc; var hi = new Image(); hi.onload = function(){ imgEl.src = fullSrc; imgEl.classList.add('is-loaded'); }; hi.src = fullSrc;
    }

    function openPicker(imageId){
      injectModalCss();
      var backdrop=document.createElement('div'); backdrop.className='nb-modal-backdrop';
      var modal=document.createElement('div'); modal.className='nb-modal';
      var h=document.createElement('h3'); h.appendChild(txt('Add to Storyboard')); modal.appendChild(h);
      var p=document.createElement('div'); p.className='hint'; p.appendChild(txt('Choose a storyboard to add this image to.')); modal.appendChild(p);
      var list=document.createElement('div'); list.className='nb-list'; list.innerHTML='<div class="hint" style="padding:12px"><span class="spinner"></span> Loading storyboards…</div>'; modal.appendChild(list);
      var closeRow=document.createElement('div'); closeRow.className='nb-close'; var closeBtn=document.createElement('button'); closeBtn.className='nb-pill'; closeBtn.appendChild(txt('Close')); closeRow.appendChild(closeBtn); modal.appendChild(closeRow);
      backdrop.appendChild(modal); document.body.appendChild(backdrop);
      backdrop.addEventListener('click', function(e){ if(e.target===backdrop){ document.body.removeChild(backdrop); }});
      closeBtn.addEventListener('click', function(){ document.body.removeChild(backdrop); });

      fetch('/api/storyboards').then(function(r){ return r.json().then(function(j){ return {ok:r.ok, body:j};});}).then(function(x){
        if(!x.ok){ list.innerHTML = '<div class="hint" style="padding:12px">Failed to load</div>'; return; }
        var arr = x.body.storyboards || [];
        if(!arr.length){ list.innerHTML = '<div class="hint" style="padding:12px">You have no storyboards yet.</div>'; return; }
        list.innerHTML='';
        arr.forEach(function(sb){
          var row=document.createElement('div'); row.className='nb-row';
          var left=document.createElement('div');
          var title=document.createElement('div'); title.style.fontWeight='700'; title.appendChild(txt(sb.title||'')); left.appendChild(title);
          var desc=document.createElement('div'); desc.className='hint'; desc.appendChild(txt(sb.description||'')); left.appendChild(desc);
          var add=document.createElement('button'); add.className='nb-pill'; add.appendChild(txt('Add')); add.addEventListener('click', function(){
            add.disabled=true; add.textContent='Adding…';
            fetch('/api/storyboard/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storyboardId:sb.id,imageId:imageId})})
              .then(function(r){return r.json().then(function(j){return {ok:r.ok,body:j};});})
              .then(function(x){ if(!x.ok) throw new Error(x.body.error||'Failed'); add.textContent='Added'; setTimeout(function(){ if(document.body.contains(backdrop)) document.body.removeChild(backdrop); }, 600); })
              .catch(function(e){ alert(e.message||e); add.disabled=false; add.textContent='Add'; });
          });
          row.appendChild(left); row.appendChild(add); list.appendChild(row);
        });
      }).catch(function(){ list.innerHTML = '<div class="hint" style="padding:12px">Error loading</div>'; });
    }

    function buildCard(item){
      var card = document.createElement('div'); card.className='card-gal';
      var img = document.createElement('img'); img.setAttribute('loading','lazy'); img.setAttribute('alt','generated image');
      var tiny = item.tinyUrl || item.thumbUrl || item.url || ''; var full = item.thumbUrl || item.url || '';
      blurUp(img, tiny, full); card.appendChild(img);

      var meta = document.createElement('div'); meta.className='meta';
      var ts = document.createElement('div'); ts.className='ts'; ts.appendChild(txt(item.createdAt ? new Date(item.createdAt).toLocaleString() : '')); meta.appendChild(ts);

      var details = document.createElement('details'); var summary = document.createElement('summary'); summary.appendChild(txt('Details')); details.appendChild(summary);
      var m1 = document.createElement('div'); m1.className='hint'; m1.style.marginTop='6px'; m1.appendChild(txt('Model: ' + (item.modelUsed || '')));
      var m2 = document.createElement('div'); m2.className='hint'; m2.appendChild(txt('Mime: ' + (item.mimeType || '')));
      var desc = document.createElement('div'); desc.style.marginTop='6px'; desc.style.whiteSpace='pre-wrap'; desc.appendChild(txt(item.enhancedPrompt || ''));
      details.appendChild(m1); details.appendChild(m2); details.appendChild(desc); meta.appendChild(details);

      var row = document.createElement('div'); row.className='row'; row.style.marginTop='8px';
      var a = document.createElement('a'); a.className='pill'; a.href = item.url || full; a.setAttribute('download',''); a.appendChild(txt('Download')); row.appendChild(a);
      var addSb=document.createElement('button'); addSb.className='pill'; addSb.style.marginLeft='6px'; addSb.appendChild(txt('Add to Storyboard')); addSb.addEventListener('click', function(){ openPicker(item.id); }); row.appendChild(addSb);
      var del = document.createElement('button'); del.className='pill'; del.style.marginLeft='6px'; del.appendChild(txt('Delete'));
      del.addEventListener('click', async function(){ if(!confirm('Delete this image everywhere? This cannot be undone.')) return; del.disabled = true; del.textContent = 'Deleting…'; try{ var r = await fetch('/api/image/delete',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageId: item.id }) }); var j = await r.json(); if(!r.ok) throw new Error(j.error || 'Failed'); byId('refresh').click(); }catch(e){ alert(e.message || e); del.disabled = false; del.textContent = 'Delete'; } });
      row.appendChild(del);

      meta.appendChild(row); card.appendChild(meta); return card;
    }

    async function load(){
      var grid = byId('grid'); grid.innerHTML = '<div class="hint"><span class="spinner"></span> Loading...</div>';
      try{
        var r = await fetch('/api/gallery'); var j = await r.json(); if(!r.ok) throw new Error(j.error || 'Failed to load gallery');
        var items = j.items || []; if(!items.length){ byId('empty').style.display='block'; grid.innerHTML=''; return; }
        byId('empty').style.display='none'; grid.innerHTML = ''; items.forEach(function(it){ grid.appendChild(buildCard(it)); });
      }catch(e){ grid.innerHTML = '<div class="hint">' + (e.message || e) + '</div>'; }
    }

    byId('refresh').addEventListener('click', load);
    load();
  })();`);
});

/* ---------- Storyboard page JS (timeline rendering) ---------- */
router.get("/assets/storyboard.js", (_req, res) => {
  res.type("application/javascript").send(`(function(){
    function g(id){return document.getElementById(id);}
    function qs(name){var u=new URL(location.href);return u.searchParams.get(name)||'';}
    var sbid = qs('id'); if(!sbid){ document.body.innerHTML='<div class="wrap"><div class="card">Missing storyboard id</div></div>'; return; }

    function blurUp(imgEl, tinySrc, fullSrc){
      if(!fullSrc){imgEl.alt='missing';return;}
      if(!tinySrc || tinySrc===fullSrc){ imgEl.src=fullSrc; imgEl.classList.add('is-loaded'); return; }
      imgEl.classList.add('blur-up'); imgEl.src=tinySrc; var hi=new Image(); hi.onload=function(){ imgEl.src=fullSrc; imgEl.classList.add('is-loaded'); }; hi.src=fullSrc;
    }

    function toTitle(str){
      if(!str) return 'Untitled'; var s=String(str).trim();
      var words=s.replace(/[._-]/g,' ').split(/\\s+/).slice(0,7);
      for(var i=0;i<words.length;i++){ words[i]=words[i].charAt(0).toUpperCase()+words[i].slice(1); }
      return words.join(' ');
    }

    function itemEl(it){
      var wrap=document.createElement('div'); wrap.className='sb-item';
      var rail=document.createElement('div'); rail.className='sb-rail'; var dot=document.createElement('div'); dot.className='sb-dot'; rail.appendChild(dot);

      var card=document.createElement('div'); card.className='sb-card';
      var inner=document.createElement('div'); inner.className='sb-inner';

      var left=document.createElement('div');
      var title=document.createElement('h3'); title.className='sb-title'; title.appendChild(document.createTextNode(toTitle(it.enhancedPrompt||it.prompt||'Image')));
      var desc=document.createElement('div'); desc.className='sb-desc'; desc.appendChild(document.createTextNode(it.enhancedPrompt||''));
      var actions=document.createElement('div'); actions.className='sb-actions';
      var upscale=document.createElement('button'); upscale.className='btn-neo'; upscale.appendChild(document.createTextNode('Upscale'));
      var video=document.createElement('button'); video.className='btn-neo'; video.appendChild(document.createTextNode('Generate Video'));
      var remove=document.createElement('button'); remove.className='pill'; remove.appendChild(document.createTextNode('Remove'));
      remove.addEventListener('click', async function(){
        remove.disabled=true; remove.textContent='Removing…';
        try{
          var rr=await fetch('/api/storyboard/remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storyboardId:sbid,imageId:it.imageId})});
          var jj=await rr.json(); if(!rr.ok) throw new Error(jj.error||'Failed');
          await load();
        }catch(e){ alert(e.message||e); remove.disabled=false; remove.textContent='Remove'; }
      });
      actions.appendChild(upscale); actions.appendChild(video); actions.appendChild(remove);
      left.appendChild(title); left.appendChild(desc); left.appendChild(actions);

      var media=document.createElement('div'); media.className='sb-media';
      var img=document.createElement('img'); var tiny=it.tinyUrl||it.thumbUrl||it.url||''; var full=it.thumbUrl||it.url||''; blurUp(img,tiny,full);
      media.appendChild(img);

      inner.appendChild(left); inner.appendChild(media);
      card.appendChild(inner);

      wrap.appendChild(rail); wrap.appendChild(card);
      return wrap;
    }

    async function load(){
      var head=g('head'); var list=g('itemsWrap');
      head.innerHTML='<div class="hint"><span class="spinner"></span> Loading…</div>'; list.innerHTML='';
      try{
        var r=await fetch('/api/storyboard?id='+encodeURIComponent(sbid));
        var j=await r.json(); if(!r.ok) throw new Error(j.error||'Failed');
        var when=j.createdAt? new Date(j.createdAt).toLocaleString():'';
        var hd=document.createElement('div');
        var t=document.createElement('div'); t.style.fontSize='20px'; t.style.fontWeight='800'; t.appendChild(document.createTextNode(j.title||''));
        var d=document.createElement('div'); d.className='hint'; d.style.margin='6px 0'; d.appendChild(document.createTextNode(j.description||''));
        var m=document.createElement('div'); m.className='hint'; m.appendChild(document.createTextNode(when));
        hd.appendChild(t); hd.appendChild(d); hd.appendChild(m); head.innerHTML=''; head.appendChild(hd);

        var items=j.items||[];
        if(!items.length){ g('empty').style.display='block'; }
        else{ g('empty').style.display='none'; items.forEach(function(it){ list.appendChild(itemEl(it)); }); }
      }catch(e){ head.innerHTML='<div class="hint">'+(e.message||e)+'</div>'; }
    }

    load();
  })();`);
});

/* ---------- Image-To-Image page JS (externalized to avoid inline parse issues) ---------- */
router.get("/assets/img2img.js", (_req, res) => {
  res.type("application/javascript").send(`(function(){
    function g(i){return document.getElementById(i);}
    var dataUrl=null, mime=null;
    var dz=g('dz'), file=g('file'), dzInner=g('dzInner');

    function setPreview(url){
      dataUrl=url;
      g('stage').innerHTML='<span class="hint">Ready. Click Generate.</span>';
      dz.innerHTML =
        '<input id="file" type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer" />' +
        '<img alt="base" src="'+url+'" />' +
        '<div class="dz-hint"><span class="dz-pill">PNG / JPG</span><span class="dz-pill">16:9 preferred</span></div>';
      file = g('file');
      file.addEventListener('change', onFileChange);
    }

    function onFileChange(){
      var f=this.files&&this.files[0];
      if(!f){
        dataUrl=null; mime=null;
        dz.innerHTML =
          '<input id="file" type="file" accept="image/*" />' +
          '<div id="dzInner" style="text-align:center;padding:22px">' +
          '<div class="dz-title" style="font-size:16px;margin-bottom:6px">Upload base image</div>' +
          '<div class="hint">Click to choose or drag & drop</div>' +
          '</div>' +
          '<div class="dz-hint"><span class="dz-pill">PNG / JPG</span><span class="dz-pill">16:9 preferred</span></div>';
        file = g('file');
        file.addEventListener('change', onFileChange);
        return;
      }
      mime=f.type||'image/png'; var rd=new FileReader();
      rd.onload=function(e){ setPreview(e.target.result); };
      rd.readAsDataURL(f);
    }

    // initial bind
    file.addEventListener('change', onFileChange);

    // Drag & drop support
    ['dragenter','dragover'].forEach(function(ev){
      dz.addEventListener(ev,function(e){ e.preventDefault(); dz.style.borderColor='#3a4680'; });
    });
    ['dragleave','drop'].forEach(function(ev){
      dz.addEventListener(ev,function(e){ e.preventDefault(); dz.style.borderColor='#2a3354'; });
    });
    dz.addEventListener('drop',function(e){
      var f=(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); if(!f) return;
      mime=f.type||'image/png'; var rd=new FileReader(); rd.onload=function(ev){ setPreview(ev.target.result); }; rd.readAsDataURL(f);
    });

    // Download button
    g('download').addEventListener('click',function(){
      var img=document.querySelector('#stage img'); if(!img) return;
      var a=document.createElement('a'); a.href=img.src; a.download='variation.png'; a.click();
    });

    // Generate (prefix “Show me ” silently on the client)
    g('go').addEventListener('click',function(){
      var p=g('prompt').value.trim();
      if(!dataUrl){ alert('Please choose a base image.'); return; }
      if(!p){ alert('Please enter a prompt.'); return; }
      var combined = 'Show me ' + p;

      var btn=this; btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Generating...';
      g('stage').innerHTML='<div class="hint"><span class="spinner"></span> Calling APIs...</div>';

      fetch('/api/img2img',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ prompt: combined, image:{ dataUrl: dataUrl } })
      })
      .then(function(r){ return r.json().then(function(j){ return { ok:r.ok, body:j }; }); })
      .then(function(x){
        var d=x.body; if(!x.ok) throw new Error(d.error||'Request failed');
        if(d.imageBase64 && d.mimeType){
          var url='data:'+d.mimeType+';base64,'+d.imageBase64;
          g('stage').innerHTML='<img class="frame" alt="Generated" src="'+url+'" />';
          g('download').disabled=false;
        } else {
          g('stage').innerHTML='<div class="hint">No image returned.</div>'; g('download').disabled=true;
        }
        if(d.galleryUrl){ var link=g('viewInGallery'); link.style.display='inline-block'; link.href='/gallery'; }
      })
      .catch(function(err){
        console.error(err);
        g('stage').innerHTML='<div class="hint">Error: '+(err.message||err)+'</div>'; g('download').disabled=true;
      })
      .finally(function(){ btn.disabled=false; btn.textContent='Generate'; });
    });
  })();`);
});

export default router;
