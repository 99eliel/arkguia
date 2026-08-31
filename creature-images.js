(function(){
  'use strict';
  // As imagens externas foram desativadas porque os hosts bloqueiam hotlink em alguns navegadores/PWAs.
  // Mantemos este arquivo como ponto de compatibilidade e carregador dos módulos adicionais.
  window.ARK_CREATURE_IMAGES={enabled:false,reason:'external-hotlink-disabled'};

  function load(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.onload=resolve;
      s.onerror=reject;
      document.body.appendChild(s);
    });
  }

  load('./crafting-data.js?v=270')
    .then(()=>load('./crafting.js?v=270'))
    .catch(()=>{});
})();
