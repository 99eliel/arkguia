(function(){
  'use strict';

  function closeDialog(dialog){
    if(!dialog) return;
    try{
      if(dialog.open && typeof dialog.close==='function') dialog.close();
      else dialog.removeAttribute('open');
    }catch(_){
      dialog.removeAttribute('open');
    }
  }

  // Delegação única para todos os modais atuais e futuros do app.
  // pointerdown fecha antes que WebView/PWA converta o toque em outros eventos.
  document.addEventListener('pointerdown',function(event){
    const button=event.target.closest('.close');
    if(!button) return;
    const dialog=button.closest('dialog');
    if(!dialog) return;
    event.preventDefault();
    event.stopPropagation();
    closeDialog(dialog);
  },true);

  // Fallback para navegadores/WebViews sem Pointer Events confiáveis.
  document.addEventListener('click',function(event){
    const button=event.target.closest('.close');
    if(!button) return;
    const dialog=button.closest('dialog');
    if(!dialog) return;
    event.preventDefault();
    event.stopPropagation();
    closeDialog(dialog);
  },true);

  // Android/teclado: Escape/voltar do navegador quando entregue como Escape.
  document.addEventListener('keydown',function(event){
    if(event.key!=='Escape') return;
    const dialogs=[...document.querySelectorAll('dialog[open]')];
    const dialog=dialogs[dialogs.length-1];
    if(dialog){
      event.preventDefault();
      closeDialog(dialog);
    }
  },true);

  window.ARK_DIALOGS={close:closeDialog};
})();
