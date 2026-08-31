(function(){
  'use strict';
  const recipes=Array.isArray(window.ARK_CRAFTING_RECIPES)?window.ARK_CRAFTING_RECIPES:[];
  const KEY='arkguia-crafting-v1';
  const $=s=>document.querySelector(s);
  const list=$('#list');
  const count=$('#visibleCount');
  const tools=$('.tools');
  const tabs=$('#tabs');
  const modeSwitch=$('.modeSwitch');
  if(!list||!count||!tools||!tabs||!modeSwitch) return;

  function readState(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'?v:{};}catch(_){return {};}
  }
  let state=readState();
  let active=false;
  let current=null;

  function saveState(){
    localStorage.setItem(KEY,JSON.stringify(state));
    if(window.ARK_CLOUD&&typeof window.ARK_CLOUD.saveCrafting==='function') window.ARK_CLOUD.saveCrafting(state).catch(()=>{});
  }
  function replaceState(value){
    if(!value||typeof value!=='object'||Array.isArray(value)) return;
    state=value;
    localStorage.setItem(KEY,JSON.stringify(state));
    if(active) render();
  }
  window.addEventListener('arkguia-cloud-loaded',e=>{
    const crafting=e.detail&&e.detail.crafting;
    if(crafting&&typeof crafting==='object'&&!Array.isArray(crafting)) replaceState(crafting);
    else if(active) setTimeout(render,0);
  });
  if(window.ARK_CLOUD&&window.ARK_CLOUD.initialCrafting) replaceState(window.ARK_CLOUD.initialCrafting);

  const style=document.createElement('style');
  style.textContent=`
    .craftTools{display:none;grid-template-columns:1fr auto;gap:9px;margin-bottom:12px}.craftTools.active{display:grid}.craftCard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:15px;cursor:pointer}.craftCard.activePlan{border-color:#2c8652;background:linear-gradient(145deg,#112d22,#101d2d)}.craftCard h3{margin:0 0 4px;font-size:18px}.craftTop{display:flex;justify-content:space-between;gap:10px}.craftProgress{margin-top:9px;font-size:12px;color:var(--muted)}.craftProgress strong{color:var(--text)}.craftBadge{display:inline-block;padding:4px 8px;border-radius:999px;background:#0a1422;border:1px solid var(--line);font-size:11px;margin-top:7px}.ingredientRow{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #203244}.ingredientRow:last-child{border-bottom:0}.ingredientNeed{font-size:13px;color:var(--muted);margin-top:3px}.ingredientNeed.ok{color:#76e99f}.ingredientNeed.miss{color:#ffb2a8}.ownedInput{width:100%;background:#08111d;border:1px solid var(--line);border-radius:12px;padding:10px;color:var(--text);text-align:center}.qtyBox{display:grid;grid-template-columns:1fr 96px;gap:10px;align-items:center;margin:10px 0}.craftSummary{background:#0a1421;border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0}.craftSummary.ready{border-color:#2c8652;background:#0c1d16}.secondaryBtn{width:100%;border:1px solid var(--line);border-radius:14px;background:#162940;color:var(--text);font-weight:800;padding:12px;margin-top:8px}@media(max-width:520px){.craftTools{grid-template-columns:1fr}.ingredientRow{grid-template-columns:1fr 84px}.qtyBox{grid-template-columns:1fr 88px}}
  `;
  document.head.appendChild(style);

  modeSwitch.style.gridTemplateColumns='repeat(3,1fr)';
  const craftBtn=document.createElement('button');
  craftBtn.className='modeBtn';
  craftBtn.dataset.mode='crafting';
  craftBtn.textContent='🛠️ Criador';
  modeSwitch.appendChild(craftBtn);

  const craftTools=document.createElement('section');
  craftTools.className='craftTools';
  craftTools.innerHTML='<input id="craftSearch" class="field" placeholder="🔎 Buscar sela ou item..."><select id="craftCategory" class="field"><option value="all">Tudo</option><option value="Sela">Selas</option><option value="Arma">Armas</option></select>';
  count.before(craftTools);

  const dialog=document.createElement('dialog');
  dialog.id='craftDialog';
  dialog.innerHTML='<div class="modalHead"><div><div class="small" id="craftCategoryLabel"></div><h2 id="craftName"></h2><div id="craftOriginal" class="original"></div></div><button class="close" id="closeCraft">✕</button></div><div class="modalBody"><div class="qtyBox"><div><b>Quantidade que quero fabricar</b><div class="meta">A lista recalcula automaticamente.</div></div><input id="craftQty" class="ownedInput" type="number" min="1" step="1" value="1"></div><div id="craftStation" class="info"></div><div id="craftIngredients" class="info"></div><div id="craftSummary" class="craftSummary"></div><button id="clearCraft" class="secondaryBtn">Limpar quantidades que já tenho</button></div>';
  document.body.appendChild(dialog);
  $('#closeCraft').onclick=()=>dialog.close();

  function planFor(id){
    if(!state[id]||typeof state[id]!=='object') state[id]={quantity:1,owned:{}};
    if(!state[id].owned||typeof state[id].owned!=='object') state[id].owned={};
    state[id].quantity=Math.max(1,Number(state[id].quantity)||1);
    return state[id];
  }
  function recipeProgress(recipe){
    const p=planFor(recipe.id);let ok=0;
    for(const [name,base] of recipe.ingredientes){const need=base*p.quantity,have=Math.max(0,Number(p.owned[name])||0);if(have>=need)ok++;}
    return {ok,total:recipe.ingredientes.length,ready:ok===recipe.ingredientes.length};
  }
  function render(){
    if(!active) return;
    const q=($('#craftSearch').value||'').trim().toLowerCase();
    const cat=$('#craftCategory').value;
    const arr=recipes.filter(r=>(cat==='all'||r.categoria===cat)&&(!q||(r.nome+' '+r.original+' '+r.estacao).toLowerCase().includes(q)));
    count.textContent=`${arr.length} receitas cadastradas. Informe quanto já tem de cada material e veja exatamente o que falta.`;
    list.innerHTML='';
    if(!arr.length){list.innerHTML='<div class="empty">Nenhuma receita encontrada.</div>';return;}
    for(const r of arr){
      const prog=recipeProgress(r),p=planFor(r.id),el=document.createElement('article');
      const hasPlan=p.quantity>1||Object.values(p.owned).some(v=>Number(v)>0);
      el.className='craftCard'+(hasPlan?' activePlan':'');
      el.innerHTML=`<div class="craftTop"><div><h3>${r.categoria==='Sela'?'🪑':'🛠️'} ${r.nome}</h3><div class="original">${r.original}</div></div><span class="craftBadge">Nv. ${r.nivel||'—'}</span></div><div class="meta">${r.estacao}</div><div class="craftProgress">Planejado: <strong>${p.quantity}x</strong> • Materiais completos: <strong>${prog.ok}/${prog.total}</strong>${prog.ready?' • ✅ pronto':''}</div>`;
      el.onclick=()=>openRecipe(r);list.appendChild(el);
    }
  }
  function openRecipe(recipe){
    current=recipe;const p=planFor(recipe.id);
    $('#craftCategoryLabel').textContent=recipe.categoria+(recipe.nivel?' • nível '+recipe.nivel:'');
    $('#craftName').textContent=recipe.nome;
    $('#craftOriginal').textContent=recipe.original;
    $('#craftQty').value=p.quantity;
    $('#craftStation').innerHTML=`<b>🏗️ Onde fabricar</b><div class="meta">${recipe.estacao}</div>`;
    renderIngredients();dialog.showModal();
  }
  function renderIngredients(){
    if(!current) return;const p=planFor(current.id),box=$('#craftIngredients');
    box.innerHTML='<b>📦 Materiais</b>';
    let totalMissing=0,complete=0;
    for(const [name,base] of current.ingredientes){
      const need=base*p.quantity,have=Math.max(0,Number(p.owned[name])||0),missing=Math.max(0,need-have);if(missing===0)complete++;totalMissing+=missing;
      const row=document.createElement('div');row.className='ingredientRow';
      row.innerHTML=`<div><strong>${name}</strong><div class="ingredientNeed ${missing===0?'ok':'miss'}">Precisa ${need} • ${missing===0?'✓ quantidade suficiente':'Faltam '+missing}</div></div><input class="ownedInput" type="number" min="0" step="1" inputmode="numeric" value="${have}" aria-label="Quantidade de ${name} que já tenho">`;
      const input=row.querySelector('input');input.oninput=()=>{p.owned[name]=Math.max(0,Number(input.value)||0);saveState();renderIngredients();};box.appendChild(row);
    }
    const summary=$('#craftSummary');const ready=complete===current.ingredientes.length;summary.className='craftSummary'+(ready?' ready':'');summary.innerHTML=ready?'<b>✅ Você já tem todos os materiais</b><div class="meta">Pode fabricar a quantidade planejada.</div>':`<b>🧭 Ainda falta material</b><div class="meta">${complete} de ${current.ingredientes.length} tipos de material completos. Continue coletando os itens marcados em vermelho.</div>`;
  }

  $('#craftQty').oninput=()=>{if(!current)return;const p=planFor(current.id);p.quantity=Math.max(1,Number($('#craftQty').value)||1);saveState();renderIngredients();};
  $('#clearCraft').onclick=()=>{if(!current)return;const p=planFor(current.id);p.owned={};saveState();renderIngredients();render();};
  $('#craftSearch').addEventListener('input',render);$('#craftCategory').addEventListener('change',render);

  function enterCrafting(){
    active=true;document.querySelectorAll('.modeBtn').forEach(b=>b.classList.toggle('active',b===craftBtn));
    tools.style.display='none';tabs.style.display='none';craftTools.classList.add('active');render();
  }
  craftBtn.onclick=enterCrafting;
  modeSwitch.querySelectorAll('.modeBtn').forEach(btn=>{
    if(btn===craftBtn)return;
    btn.addEventListener('click',()=>{active=false;craftTools.classList.remove('active');tools.style.display='grid';});
  });
})();
