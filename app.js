(function(){
  'use strict';
  const creatures=Array.isArray(window.ARK_CREATURES)?window.ARK_CREATURES:[];
  const KEY='arkguia-astraeos-v2';
  const BACKUP='arkguia-astraeos-backup';
  let done=new Set(readArray(KEY));
  let cat='all';
  let mode='creatures';
  const $=s=>document.querySelector(s);
  const list=$('#list');

  function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch(_){return [];}}
  function persistLocal(){
    const values=[...done];
    localStorage.setItem(KEY,JSON.stringify(values));
    localStorage.setItem(BACKUP,JSON.stringify({savedAt:new Date().toISOString(),done:values}));
    updateSummary();
    if(window.ARK_CLOUD&&typeof window.ARK_CLOUD.save==='function') window.ARK_CLOUD.save(values).catch(()=>{});
  }
  function mergeProgress(values){
    if(!Array.isArray(values)) return;
    const valid=new Set(creatures.map(c=>c.id));let changed=false;
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

  function installResourceUI(){
    const style=document.createElement('style');
    style.textContent=`.modeSwitch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0 12px}.modeBtn{border:1px solid var(--line);background:var(--panel);color:var(--muted);padding:12px;border-radius:14px;font-weight:800}.modeBtn.active{background:#173a2a;color:#b8ffd0;border-color:#2c8652}.resourceCard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:15px;cursor:pointer}.resourceCard h3{margin:0 0 5px;font-size:18px}.resourceTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.resourceIcon{font-size:26px}.ownedBadge{display:inline-block;margin-top:7px;padding:4px 8px;border-radius:999px;background:#173a2a;color:#aef4c5;border:1px solid #2c8652;font-size:11px;font-weight:800}.missingBadge{display:inline-block;margin-top:7px;padding:4px 8px;border-radius:999px;background:#24191a;color:#eab8b8;border:1px solid #704244;font-size:11px;font-weight:800}.collector{border:1px solid var(--line);background:#0a1421;border-radius:14px;padding:12px;margin:9px 0;cursor:pointer}.collector.have{border-color:#2c8652}.collectorHead{display:flex;justify-content:space-between;gap:8px}.collectorName{font-weight:850}.resourceHint{margin:10px 0;color:var(--muted);font-size:13px;line-height:1.45}`;
    document.head.appendChild(style);
    const sw=document.createElement('div');sw.className='modeSwitch';sw.innerHTML='<button class="modeBtn active" data-mode="creatures">🦖 Criaturas</button><button class="modeBtn" data-mode="resources">⛏️ Recursos</button>';
    $('.tools').before(sw);
    sw.querySelectorAll('.modeBtn').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));

    const dlg=document.createElement('dialog');dlg.id='resourceDetails';dlg.innerHTML='<div class="modalHead"><div><div class="small">Melhores criaturas para coletar</div><h2 id="resourceName"></h2></div><button class="close" id="closeResource">✕</button></div><div class="modalBody"><div id="resourceHint" class="resourceHint"></div><div id="resourceCollectors"></div></div>';
    document.body.appendChild(dlg);$('#closeResource').onclick=()=>dlg.close();
  }

  function setMode(next){
    mode=next;
    document.querySelectorAll('.modeBtn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    const creatureOnly=mode==='creatures';
    ['method','status','variant'].forEach(id=>$('#'+id).style.display=creatureOnly?'':'none');
    $('#tabs').style.display=creatureOnly?'flex':'none';
    $('#search').placeholder=creatureOnly?'🔎 Buscar criatura, recurso ou função...':'🔎 Buscar recurso: metal, pérola, madeira...';
    $('#search').value='';
    render();
  }

  function filtered(){
    const q=norm($('#search').value.trim()),m=$('#method').value,s=$('#status').value,v=$('#variant').value;
    return creatures.filter(c=>(!q||norm(c.nome+' '+c.original+' '+c.comida+' '+serviceText(c)).includes(q))&&(m==='all'||c.metodo===m)&&(v==='all'||c.variante===v)&&(cat==='all'||c.categoria===cat)&&(s==='all'||(s==='done'&&done.has(c.id))||(s==='todo'&&!done.has(c.id))));
  }

  function resourceCatalog(){
    const map=new Map();
    for(const c of creatures){
      const recursos=(c.servicos&&Array.isArray(c.servicos.recursos))?c.servicos.recursos:[];
      for(const r of recursos){
        const name=r[0],stars=Number(r[1])||0,rank=r[2]?Number(r[2]):null;
        if(!map.has(name)) map.set(name,[]);
        map.get(name).push({creature:c,stars,rank});
      }
    }
    return [...map.entries()].map(([name,collectors])=>({name,collectors:sortCollectors(collectors)})).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  }
  function sortCollectors(items){return items.sort((a,b)=>{
    if(a.rank&&b.rank)return a.rank-b.rank;if(a.rank)return -1;if(b.rank)return 1;
    return b.stars-a.stars||a.creature.nome.localeCompare(b.creature.nome,'pt-BR');
  });}

  function renderResources(){
    const q=norm($('#search').value.trim());
    const all=resourceCatalog();
    const arr=all.filter(r=>!q||norm(r.name).includes(q)||r.collectors.some(x=>norm(x.creature.nome+' '+x.creature.original).includes(q)));
    $('#visibleCount').textContent=`${arr.length} recursos cadastrados. Toque em um recurso para ver os melhores dinos e quais você já tem.`;
    list.innerHTML='';
    if(!arr.length){list.innerHTML='<div class="empty">Nenhum recurso encontrado.</div>';return;}
    const meta=window.ARK_RESOURCE_META||{};
    for(const r of arr){
      const owned=r.collectors.filter(x=>done.has(x.creature.id)).length;
      const best=r.collectors[0];
      const el=document.createElement('article');el.className='resourceCard';
      el.innerHTML=`<div class="resourceTop"><div><h3>${(meta[r.name]&&meta[r.name].icon)||'📦'} ${r.name}</h3><div class="meta">${r.collectors.length} criatura(s) catalogada(s)</div></div><span class="stars">${best?'★'.repeat(best.stars)+'☆'.repeat(5-best.stars):''}</span></div><div class="meta" style="margin-top:7px">Melhor opção: <b style="color:var(--text)">${best?best.creature.nome:'—'}</b></div><span class="${owned?'ownedBadge':'missingBadge'}">${owned?`✓ Você tem ${owned}`:'Você ainda não tem coletor marcado'}</span>`;
      el.onclick=()=>openResource(r);list.appendChild(el);
    }
  }

  function openResource(r){
    const meta=(window.ARK_RESOURCE_META||{})[r.name]||{};
    $('#resourceName').textContent=((meta.icon||'📦')+' '+r.name);
    $('#resourceHint').textContent=meta.hint||'As criaturas estão ordenadas pela eficiência cadastrada para este recurso.';
    const box=$('#resourceCollectors');box.innerHTML='';
    r.collectors.forEach((x,i)=>{
      const have=done.has(x.creature.id),el=document.createElement('div');el.className='collector '+(have?'have':'');
      el.innerHTML=`<div class="collectorHead"><div><div class="collectorName">${i+1}. ${x.creature.nome}</div><div class="original">${x.creature.nome!==x.creature.original?'No jogo: '+x.creature.original:''}</div></div><div class="stars">${'★'.repeat(x.stars)}${'☆'.repeat(5-x.stars)}</div></div><span class="${have?'ownedBadge':'missingBadge'}">${have?'✓ JÁ TENHO':'AINDA NÃO TENHO'}</span>${x.rank?`<span class="badge">Top #${x.rank}</span>`:''}`;
      el.onclick=()=>{$('#resourceDetails').close();openDetails(x.creature);};box.appendChild(el);
    });
    $('#resourceDetails').showModal();
  }

  function renderCreatures(){
    const arr=filtered();$('#visibleCount').textContent=`Mostrando ${arr.length} de ${creatures.length} criaturas/variantes domesticáveis cadastradas.`;list.innerHTML='';
    if(!arr.length){list.innerHTML='<div class="empty">Nenhuma criatura encontrada com esses filtros.</div>';return;}
    for(const c of arr){
      const u=c.servicos||{funcoes:[]},el=document.createElement('article');el.className='dino '+(done.has(c.id)?'done':'');
      el.innerHTML=`<div class="check">✓</div><div><h3>${c.nome}</h3>${c.nome!==c.original?`<div class="original">No jogo: ${c.original}</div>`:''}<div class="meta">${c.comida}</div><span class="badge">${c.metodo}</span>${(u.funcoes||[]).slice(0,2).map(x=>`<span class="badge utilityBadge">${x}</span>`).join('')}${c.variante!=='Normal'?'<span class="badge variant">Aberrante</span>':''}</div>${done.has(c.id)?'<span class="doneMark">DOMADA</span>':''}`;
      el.onclick=()=>openDetails(c);list.appendChild(el);
    }
  }
  function render(){mode==='resources'?renderResources():renderCreatures();}

  function openDetails(c){
    const u=c.servicos||{funcoes:[],recursos:[],detalhe:''};
    $('#modalCategory').textContent=c.categoria+(c.variante!=='Normal'?' • Variante '+c.variante:'');$('#modalName').textContent=c.nome;$('#modalOriginal').textContent=c.nome!==c.original?'Nome no jogo: '+c.original:'';
    $('#modalFunctions').innerHTML=(u.funcoes||[]).map(x=>`<span class="badge utilityBadge">${x}</span>`).join('');$('#modalUtilityText').textContent=u.detalhe||'';
    const rb=$('#resourceBox'),mr=$('#modalResources');if(u.recursos&&u.recursos.length){rb.style.display='block';mr.innerHTML=u.recursos.map(r=>`<div class="resourceRow"><span>${r[0]}</span><span class="stars">${'★'.repeat(r[1])}${'☆'.repeat(5-r[1])}${r[2]?`<span class="rank">Top #${r[2]}</span>`:''}</span></div>`).join('');}else rb.style.display='none';
    $('#modalMethod').textContent=c.metodo;$('#modalFood').textContent=c.comida;$('#modalHow').textContent=c.como;$('#modalTip').textContent=c.dica||'Prepare comida e recursos antes de começar e mantenha a área limpa de predadores.';
    const b=$('#modalToggle'),sync=()=>{b.textContent=done.has(c.id)?'↩ Marcar como não domada':'✓ Marcar como domada';b.className='primary'+(done.has(c.id)?' undo':'');};sync();
    b.onclick=()=>{done.has(c.id)?done.delete(c.id):done.add(c.id);persistLocal();render();sync();};$('#details').showModal();
  }

  installResourceUI();
  ['search','method','status','variant'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');cat=b.dataset.cat;render();});
  let deferredPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').style.display='block';});
  $('#installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').style.display='none';};

  if(!creatures.length){list.innerHTML='<div class="empty">Erro ao carregar a lista. Atualize a página; se continuar, o arquivo creatures.js não foi carregado.</div>';$('#visibleCount').textContent='Falha ao carregar o catálogo.';}else{updateSummary();render();}
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=240').catch(()=>{}));
})();
