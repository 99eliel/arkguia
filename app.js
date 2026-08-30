(function(){
  'use strict';
  const creatures=Array.isArray(window.ARK_CREATURES)?window.ARK_CREATURES:[];
  const KEY='arkguia-astraeos-v2';
  const BACKUP='arkguia-astraeos-backup';
  let done=new Set(readArray(KEY));
  let cat='all';
  const $=s=>document.querySelector(s);
  const list=$('#list');

  function readArray(key){
    try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch(_){return [];}
  }
  function persistLocal(){
    const values=[...done];
    localStorage.setItem(KEY,JSON.stringify(values));
    localStorage.setItem(BACKUP,JSON.stringify({savedAt:new Date().toISOString(),done:values}));
    updateSummary();
    if(window.ARK_CLOUD&&typeof window.ARK_CLOUD.save==='function') window.ARK_CLOUD.save(values).catch(()=>{});
  }
  function mergeProgress(values){
    if(!Array.isArray(values)) return;
    const valid=new Set(creatures.map(c=>c.id));
    let changed=false;
    for(const id of values){if(valid.has(id)&&!done.has(id)){done.add(id);changed=true;}}
    if(changed){localStorage.setItem(KEY,JSON.stringify([...done]));render();updateSummary();}
  }
  window.addEventListener('arkguia-cloud-loaded',e=>mergeProgress(e.detail&&e.detail.done));

  function norm(v){return(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function serviceText(c){const s=c.servicos||{funcoes:[],recursos:[]};return [...(s.funcoes||[]),...(s.recursos||[]).map(r=>r[0]),s.detalhe||''].join(' ');}
  function updateSummary(){
    const n=done.size,t=creatures.length,p=t?Math.round(n/t*100):0;
    $('#doneCount').textContent=n;$('#totalCount').textContent=t;$('#leftCount').textContent=Math.max(0,t-n);$('#doneCard').textContent=n;$('#percent').textContent=p+'% concluído';$('#progressBar').style.width=p+'%';
  }
  function filtered(){
    const q=norm($('#search').value.trim()),m=$('#method').value,s=$('#status').value,v=$('#variant').value;
    return creatures.filter(c=>(!q||norm(c.nome+' '+c.original+' '+c.comida+' '+serviceText(c)).includes(q))&&(m==='all'||c.metodo===m)&&(v==='all'||c.variante===v)&&(cat==='all'||c.categoria===cat)&&(s==='all'||(s==='done'&&done.has(c.id))||(s==='todo'&&!done.has(c.id))));
  }
  function render(){
    const arr=filtered();
    $('#visibleCount').textContent=`Mostrando ${arr.length} de ${creatures.length} criaturas/variantes domesticáveis cadastradas.`;
    list.innerHTML='';
    if(!arr.length){list.innerHTML='<div class="empty">Nenhuma criatura encontrada com esses filtros.</div>';return;}
    for(const c of arr){
      const u=c.servicos||{funcoes:[]};
      const el=document.createElement('article');
      el.className='dino '+(done.has(c.id)?'done':'');
      el.innerHTML=`<div class="check">✓</div><div><h3>${c.nome}</h3>${c.nome!==c.original?`<div class="original">No jogo: ${c.original}</div>`:''}<div class="meta">${c.comida}</div><span class="badge">${c.metodo}</span>${(u.funcoes||[]).slice(0,2).map(x=>`<span class="badge utilityBadge">${x}</span>`).join('')}${c.variante!=='Normal'?'<span class="badge variant">Aberrante</span>':''}</div>${done.has(c.id)?'<span class="doneMark">DOMADA</span>':''}`;
      el.addEventListener('click',()=>openDetails(c));
      list.appendChild(el);
    }
  }
  function openDetails(c){
    const u=c.servicos||{funcoes:[],recursos:[],detalhe:''};
    $('#modalCategory').textContent=c.categoria+(c.variante!=='Normal'?' • Variante '+c.variante:'');
    $('#modalName').textContent=c.nome;$('#modalOriginal').textContent=c.nome!==c.original?'Nome no jogo: '+c.original:'';
    $('#modalFunctions').innerHTML=(u.funcoes||[]).map(x=>`<span class="badge utilityBadge">${x}</span>`).join('');$('#modalUtilityText').textContent=u.detalhe||'';
    const rb=$('#resourceBox'),mr=$('#modalResources');
    if(u.recursos&&u.recursos.length){rb.style.display='block';mr.innerHTML=u.recursos.map(r=>`<div class="resourceRow"><span>${r[0]}</span><span class="stars">${'★'.repeat(r[1])}${'☆'.repeat(5-r[1])}${r[2]?`<span class="rank">Top #${r[2]}</span>`:''}</span></div>`).join('');}else rb.style.display='none';
    $('#modalMethod').textContent=c.metodo;$('#modalFood').textContent=c.comida;$('#modalHow').textContent=c.como;$('#modalTip').textContent=c.dica||'Prepare comida e recursos antes de começar e mantenha a área limpa de predadores.';
    const b=$('#modalToggle');
    const sync=()=>{b.textContent=done.has(c.id)?'↩ Marcar como não domada':'✓ Marcar como domada';b.className='primary'+(done.has(c.id)?' undo':'');};
    sync();
    b.onclick=()=>{done.has(c.id)?done.delete(c.id):done.add(c.id);persistLocal();render();sync();};
    $('#details').showModal();
  }

  ['search','method','status','variant'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');cat=b.dataset.cat;render();});

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').style.display='block';});
  $('#installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').style.display='none';};

  if(!creatures.length){
    list.innerHTML='<div class="empty">Erro ao carregar a lista. Atualize a página; se continuar, o arquivo creatures.js não foi carregado.</div>';
    $('#visibleCount').textContent='Falha ao carregar o catálogo.';
  }else{updateSummary();render();}

  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=230').catch(()=>{}));
})();
