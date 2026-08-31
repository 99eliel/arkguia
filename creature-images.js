(function(){
  'use strict';

  // O catálogo de criação é um módulo independente, carregado após a interface principal existir.
  function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});}
  if(!window.ARK_CRAFTING_RECIPES){loadScript('./crafting-data.js?v=280').then(()=>loadScript('./crafting.js?v=280')).catch(()=>{});}else if(!document.querySelector('[data-mode="crafting"]')){loadScript('./crafting.js?v=280').catch(()=>{});}

  const dialog=document.getElementById('details');
  const body=dialog&&dialog.querySelector('.modalBody');
  const nameEl=document.getElementById('modalName');
  if(!dialog||!body||!nameEl) return;

  const style=document.createElement('style');
  style.textContent=`.creaturePhoto{margin:2px 0 12px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#091421;min-height:190px;display:grid;place-items:center;position:relative}.creaturePhoto img{display:block;width:100%;height:min(330px,42vh);object-fit:contain;background:radial-gradient(circle at center,#182b40,#091421 72%);padding:8px}.creaturePhotoState{padding:42px 16px;color:var(--muted);text-align:center;font-size:13px}.creaturePhotoCredit{position:absolute;right:8px;bottom:8px;background:#07101bd9;border:1px solid #2b415c;border-radius:999px;padding:4px 7px;color:#9fb0c5;font-size:10px}`;
  document.head.appendChild(style);

  let box=document.getElementById('creaturePhoto');
  if(!box){box=document.createElement('div');box.id='creaturePhoto';box.className='creaturePhoto';body.insertBefore(box,body.firstChild);}

  const aliases={'Therizinosaur':'Therizinosaur','Spino':'Spinosaurus','Dire Bear':'Dire Bear','Dung Beetle':'Dung Beetle','Snow Owl':'Snow Owl','Rock Drake':'Rock Drake','Roll Rat':'Roll Rat','Anglerfish':'Anglerfish','Sabertooth Salmon':'Salmon','Woolly Rhino':'Woolly Rhino'};
  function current(){const shown=nameEl.textContent.trim();return(window.ARK_CREATURES||[]).find(c=>c.nome===shown)||null;}
  function fileCandidates(c){const base=aliases[c.original]||c.original||c.nome;const list=[];if(c.variante==='Aberrante'){list.push(`Aberrant ${base}_ASA.png`);list.push(`Aberrant ${base}.png`);}list.push(`${base}_ASA.png`);list.push(`${base}.png`);if(c.nome&&c.nome!==base){list.push(`${c.nome}_ASA.png`);list.push(`${c.nome}.png`);}return[...new Set(list.filter(Boolean))];}
  function rawUrl(file){return'https://raw.githubusercontent.com/arkutils/species-images/main/images/'+encodeURIComponent(file);}

  let run=0,last='';
  function render(){if(!dialog.open)return;const c=current();if(!c)return;const id=c.id||c.nome;if(id===last&&box.querySelector('img'))return;last=id;const my=++run,files=fileCandidates(c);let i=0;box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem de '+c.nome+'...</div>';function next(){if(my!==run)return;if(i>=files.length){box.innerHTML='<div class="creaturePhotoState">🦖 Ainda não há imagem compatível cadastrada para esta criatura.</div>';return;}const file=files[i++],img=new Image();img.alt='Imagem de '+c.nome;img.loading='eager';img.decoding='async';img.onload=()=>{if(my!==run)return;box.innerHTML='';box.appendChild(img);const credit=document.createElement('span');credit.className='creaturePhotoCredit';credit.textContent='Imagem: arkutils/species-images';box.appendChild(credit);};img.onerror=next;img.src=rawUrl(file);}next();}

  new MutationObserver(()=>{last='';queueMicrotask(render);}).observe(nameEl,{childList:true,characterData:true,subtree:true});
  new MutationObserver(()=>{if(dialog.open){last='';queueMicrotask(render);}}).observe(dialog,{attributes:true,attributeFilter:['open']});
  window.ARK_CREATURE_IMAGES={enabled:true,show:()=>{last='';render();}};
})();
