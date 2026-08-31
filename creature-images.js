(function(){
  'use strict';
  const dialog=document.getElementById('details');
  const body=dialog&&dialog.querySelector('.modalBody');
  const nameEl=document.getElementById('modalName');
  if(!dialog||!body||!nameEl) return;

  const style=document.createElement('style');
  style.textContent=`.creaturePhoto{margin:2px 0 12px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#091421;min-height:190px;display:grid;place-items:center;position:relative}.creaturePhoto img{display:block;width:100%;height:min(330px,42vh);object-fit:contain;background:radial-gradient(circle at center,#182b40,#091421 72%)}.creaturePhotoState{padding:42px 16px;color:var(--muted);text-align:center;font-size:13px}.creaturePhotoCredit{position:absolute;right:8px;bottom:8px;background:#07101bd9;border:1px solid #2b415c;border-radius:999px;padding:4px 7px;color:#9fb0c5;font-size:10px}`;
  document.head.appendChild(style);

  let box=document.getElementById('creaturePhoto');
  if(!box){box=document.createElement('div');box.id='creaturePhoto';box.className='creaturePhoto';body.insertBefore(box,body.firstChild);}

  const aliases={
    'Dire Bear':'direbear','Giant Bee':'giantbee','Dung Beetle':'dungbeetle','Snow Owl':'snowowl','Rock Drake':'rockdrake','Roll Rat':'rollrat','Glowtail':'glowtail','Featherlight':'featherlight','Bulbdog':'bulbdog','Shinehorn':'shinehorn','Anglerfish':'angler','Sabertooth Salmon':'sabertoothsalmon','Woolly Rhino':'woollyrhino','Therizinosaur':'therizinosaurus','Spino':'spinosaurus','Rex':'rex','Argentavis':'argentavis','Ankylosaurus':'ankylosaurus','Beelzebufo':'beelzebufo','Castoroides':'castoroides','Doedicurus':'doedicurus','Megatherium':'megatherium','Mammoth':'mammoth','Baryonyx':'baryonyx','Quetzal':'quetzal','Pteranodon':'pteranodon','Pelagornis':'pelagornis','Procoptodon':'procoptodon','Giganotosaurus':'giganotosaurus','Carcharodontosaurus':'carcharodontosaurus','Thylacoleo':'thylacoleo','Direwolf':'direwolf','Iguanodon':'iguanodon','Triceratops':'triceratops','Stegosaurus':'stegosaurus','Brontosaurus':'brontosaurus','Oviraptor':'oviraptor','Daeodon':'daeodon','Yutyrannus':'yutyrannus','Otter':'otter','Basilosaurus':'basilosaurus','Equus':'equus','Phiomia':'phiomia','Achatina':'achatina','Moschops':'moschops','Gigantopithecus':'gigantopithecus'
  };
  function clean(v){return(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  function getCreature(){const shown=nameEl.textContent.trim();return(window.ARK_CREATURES||[]).find(c=>c.nome===shown)||null;}
  function candidates(c){const base=c.original||c.nome||'';return[...new Set([aliases[base],clean(base),clean(c.nome)].filter(Boolean))];}
  function url(slug){return'https://www.dododex.com/media/creature/'+slug+'.png';}

  let run=0,lastId='';
  function render(){
    if(!dialog.open) return;
    const c=getCreature();
    if(!c) return;
    const id=c.id||c.nome;
    if(id===lastId&&box.querySelector('img')) return;
    lastId=id;
    const my=++run,slugs=candidates(c);let i=0;
    box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem de '+c.nome+'...</div>';
    const next=()=>{
      if(my!==run)return;
      if(i>=slugs.length){box.innerHTML='<div class="creaturePhotoState">🦖 Imagem não encontrada para esta criatura.</div>';return;}
      const img=document.createElement('img');
      img.alt='Imagem de '+c.nome;
      img.decoding='async';
      img.onload=()=>{if(my!==run)return;box.innerHTML='';box.appendChild(img);const credit=document.createElement('span');credit.className='creaturePhotoCredit';credit.textContent='Imagem: Dododex';box.appendChild(credit);};
      img.onerror=()=>{i++;next();};
      img.src=url(slugs[i]);
    };
    next();
  }

  new MutationObserver(()=>{lastId='';queueMicrotask(render);}).observe(nameEl,{childList:true,characterData:true,subtree:true});
  new MutationObserver(()=>{if(dialog.open){lastId='';queueMicrotask(render);}}).observe(dialog,{attributes:true,attributeFilter:['open']});
  dialog.addEventListener('click',()=>setTimeout(render,0));
  window.ARK_CREATURE_IMAGES={show:()=>{lastId='';render();}};
})();
