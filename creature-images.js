(function(){
  'use strict';
  const dialog=document.getElementById('details');
  if(!dialog) return;

  const body=dialog.querySelector('.modalBody');
  if(!body) return;

  const style=document.createElement('style');
  style.textContent=`
    .creaturePhoto{margin:2px 0 12px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#091421;min-height:190px;display:grid;place-items:center;position:relative}
    .creaturePhoto img{display:block;width:100%;height:min(330px,42vh);object-fit:contain;background:radial-gradient(circle at center,#182b40,#091421 72%)}
    .creaturePhotoState{padding:42px 16px;color:var(--muted);text-align:center;font-size:13px}
    .creaturePhotoCredit{position:absolute;right:8px;bottom:8px;background:#07101bd9;border:1px solid #2b415c;border-radius:999px;padding:4px 7px;color:#9fb0c5;font-size:10px}
  `;
  document.head.appendChild(style);

  const box=document.createElement('div');
  box.id='creaturePhoto';
  box.className='creaturePhoto';
  box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem...</div>';
  body.insertBefore(box,body.firstChild);

  const cache=new Map();
  let requestToken=0;

  function findCreature(){
    const name=(document.getElementById('modalName')?.textContent||'').trim();
    return (window.ARK_CREATURES||[]).find(c=>c.nome===name)||null;
  }

  function pageTitle(c){
    if(!c) return '';
    if(c.variante==='Aberrante') return 'Aberrant '+c.original;
    return c.original||c.nome||'';
  }

  async function wikiThumbnail(title){
    if(cache.has(title)) return cache.get(title);
    const url='https://ark.wiki.gg/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail|original&pithumbsize=900&titles='+encodeURIComponent(title);
    try{
      const response=await fetch(url,{mode:'cors'});
      if(!response.ok) throw new Error('wiki');
      const data=await response.json();
      const pages=data&&data.query&&data.query.pages?Object.values(data.query.pages):[];
      const page=pages[0]||{};
      const src=(page.original&&page.original.source)||(page.thumbnail&&page.thumbnail.source)||null;
      cache.set(title,src);
      return src;
    }catch(_){cache.set(title,null);return null;}
  }

  async function load(){
    const c=findCreature();
    if(!c) return;
    const token=++requestToken;
    box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem de '+c.nome+'...</div>';
    let src=await wikiThumbnail(pageTitle(c));
    if(!src&&c.variante==='Aberrante') src=await wikiThumbnail(c.original);
    if(token!==requestToken) return;
    if(!src){
      box.innerHTML='<div class="creaturePhotoState">🦖 Imagem não encontrada para esta criatura.<br><small>A ficha continua disponível normalmente.</small></div>';
      return;
    }
    const img=document.createElement('img');
    img.alt='Imagem de '+c.nome;
    img.loading='eager';
    img.referrerPolicy='no-referrer';
    img.src=src;
    img.onerror=()=>{if(token===requestToken)box.innerHTML='<div class="creaturePhotoState">🦖 Não foi possível carregar a imagem agora.</div>';};
    box.innerHTML='';
    box.appendChild(img);
    const credit=document.createElement('span');
    credit.className='creaturePhotoCredit';
    credit.textContent='ARK Wiki';
    box.appendChild(credit);
  }

  dialog.addEventListener('toggle',()=>{if(dialog.open)load();});
})();
