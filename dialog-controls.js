(function(){
  'use strict';

  function closeDialog(dialog){
    if(!dialog) return;
    try{
      if(dialog.open && typeof dialog.close==='function') dialog.close();
      else dialog.removeAttribute('open');
    }catch(_){dialog.removeAttribute('open');}
  }

  document.addEventListener('pointerdown',function(event){
    const button=event.target.closest('.close');
    if(!button) return;
    const dialog=button.closest('dialog');
    if(!dialog) return;
    event.preventDefault();event.stopPropagation();closeDialog(dialog);
  },true);

  document.addEventListener('click',function(event){
    const button=event.target.closest('.close');
    if(!button) return;
    const dialog=button.closest('dialog');
    if(!dialog) return;
    event.preventDefault();event.stopPropagation();closeDialog(dialog);
  },true);

  document.addEventListener('keydown',function(event){
    if(event.key!=='Escape') return;
    const dialogs=[...document.querySelectorAll('dialog[open]')];
    const dialog=dialogs[dialogs.length-1];
    if(dialog){event.preventDefault();closeDialog(dialog);}
  },true);

  window.ARK_DIALOGS={close:closeDialog};

  // Recursos globais carregados depois do app base.
  if(!document.querySelector('script[data-ark-auth]')){
    const script=document.createElement('script');
    script.src='./auth-ui.js?v=300';
    script.dataset.arkAuth='1';
    document.body.appendChild(script);
  }
})();
