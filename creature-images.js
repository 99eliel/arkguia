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

  let box=document.getElementById('creaturePhoto');
  if(!box){
    box=document.createElement('div');
    box.id='creaturePhoto';
    box.className='creaturePhoto';
    body.insertBefore(box,body.firstChild);
  }

  let token=0;
  const aliases={
    'Dire Bear':'direbear',
    'Giant Bee':'giantbee',
    'Dung Beetle':'dungbeetle',
    'Snow Owl':'snowowl',
    'Rock Drake':'rockdrake',
    'Roll Rat':'rollrat',
    'Nameless':'nameless',
    'Glowtail':'glowtail',
    'Featherlight':'featherlight',
    'Bulbdog':'bulbdog',
    'Shinehorn':'shinehorn',
    'Anglerfish':'angler',
    'Sabertooth Salmon':'sabertoothsalmon',
    'Woolly Rhino':'woollyrhino',
    'Procoptodon':'procoptodon',
    'Carcharodontosaurus':'carcharodontosaurus',
    'Giganotosaurus':'giganotosaurus',
    'Therizinosaur':'therizinosaurus',
    'Spino':'spinosaurus',
    'Rex':'rex',
    'Argentavis':'argentavis',
    'Ankylosaurus':'ankylosaurus'
  };

  function clean(v){return (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
  function slugCandidates(c){
    const base=c.original||c.nome||'';
    const a=[];
    if(aliases[base]) a.push(aliases[base]);
    a.push(clean(base));
    if(c.nome&&c.nome!==base) a.push(clean(c.nome));
    return [...new Set(a.filter(Boolean))];
  }
  function dododexUrl(slug){return 'https://www.dododex.com/media/creature/'+encodeURIComponent(slug)+'.png';}
  function currentCreature(){
    const name=(document.getElementById('modalName')?.textContent||'').trim();
    return (window.ARK_CREATURES||[]).find(c=>c.nome===name)||null;
  }

  function show(c){
    if(!c) return;
    const my=++token;
    const slugs=slugCandidates(c);
    let i=0;
    box.innerHTML='<div class="creaturePhotoState">🦖 Carregando imagem de '+c.nome+'...</div>';

    function tryNext(){
      if(my!==token) return;
      if(i>=slugs.length){
        box.innerHTML='<div class="creaturePhotoState">🦖 Imagem ainda não cadastrada para esta criatura.</div>';
        return;
      }
      const img=new Image();
      img.alt='Imagem de '+c.nome;
      img.loading='eager';
      img.referrerPolicy='no-referrer';
      img.onload=()=>{
        if(my!==token) return;
        box.innerHTML='';
        box.appendChild(img);
        const credit=document.createElement('span');
        credit.className='creaturePhotoCredit';
        credit.textContent='Imagem: Dododex';
        box.appendChild(credit);
      };
      img.onerror=()=>{i++;tryNext();};
      img.src=dododexUrl(slugs[i]);
    }
    tryNext();
  }

  window.ARK_CREATURE_IMAGES={show};

  // Carrega a imagem exatamente quando a ficha é aberta, sem depender de eventos de clique/toggle.
  const nativeShowModal=dialog.showModal.bind(dialog);
  dialog.showModal=function(){
    nativeShowModal();
    requestAnimationFrame(()=>{
      const c=currentCreature();
      if(c) show(c);
    });
  };
})();
