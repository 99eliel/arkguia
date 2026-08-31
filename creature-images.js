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
  box.innerHTML='<div class="creaturePhotoState">🦖 Imagem da criatura</div>';
  body.insertBefore(box,body.firstChild);

  let token=0;
  function fileUrl(name){
    return 'https://ark.wiki.gg/wiki/Special:Redirect/file/'+encodeURIComponent(name+'.png');
  }
  function candidates(c){
    const names=[];
    if(c.variante==='Aberrante') names.push('Aberrant '+c.original);
    names.push(c.original||c.nome);
    return [...new Set(names.filter(Boolean))];
  }
  function show(c){
    if(!c) return;
    const my=++token;
    const names=candidates(c);
    let i=0;
    box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem de '+c.nome+'...</div>';

    function tryNext(){
      if(my!==token) return;
      if(i>=names.length){
        box.innerHTML='<div class="creaturePhotoState">🦖 Imagem não encontrada para esta criatura.<br><small>A ficha continua disponível normalmente.</small></div>';
        return;
      }
      const img=document.createElement('img');
      img.alt='Imagem de '+c.nome;
      img.loading='eager';
      img.referrerPolicy='no-referrer';
      img.onload=()=>{
        if(my!==token) return;
        box.innerHTML='';
        box.appendChild(img);
        const credit=document.createElement('span');
        credit.className='creaturePhotoCredit';
        credit.textContent='ARK Wiki';
        box.appendChild(credit);
      };
      img.onerror=()=>{i++;tryNext();};
      img.src=fileUrl(names[i]);
    }
    tryNext();
  }

  window.ARK_CREATURE_IMAGES={show};
})();
