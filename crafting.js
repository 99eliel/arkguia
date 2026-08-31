(function(){
  'use strict';
  const recipes=Array.isArray(window.ARK_CRAFTING_RECIPES)?window.ARK_CRAFTING_RECIPES:[];
  const meta=window.ARK_CRAFTING_META||{};
  const KEY='arkguia-crafting-v1';
  const PAGE_SIZE=120;
  const $=s=>document.querySelector(s);
  const list=$('#list');
  const count=$('#visibleCount');
  const tools=$('.tools');
  const tabs=$('#tabs');
  const modeSwitch=$('.modeSwitch');
  if(!list||!count||!tools||!tabs||!modeSwitch) return;

  function readState(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return {};}}
  let state=readState();
  let active=false;
  let current=null;
  let visibleLimit=PAGE_SIZE;

  function normalizePlan(value){
    const p=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    const owned=p.owned&&typeof p.owned==='object'&&!Array.isArray(p.owned)?p.owned:{};
    return {quantity:Math.max(1,Number(p.quantity)||1),owned};
  }
  function readPlan(id){return normalizePlan(state[id]);}
  function editPlan(id){if(!state[id]||typeof state[id]!=='object')state[id]={quantity:1,owned:{}};state[id]=normalizePlan(state[id]);return state[id];}
  function hasPlan(id){const p=readPlan(id);return p.quantity>1||Object.values(p.owned).some(v=>Number(v)>0);}
  function compactState(){
    const next={};
    for(const [id,value] of Object.entries(state)){
      const p=normalizePlan(value);
      if(p.quantity>1||Object.values(p.owned).some(v=>Number(v)>0))next[id]=p;
    }
    state=next;
  }
  function saveState(){
    compactState();
    localStorage.setItem(KEY,JSON.stringify(state));
    if(window.ARK_CLOUD&&typeof window.ARK_CLOUD.saveCrafting==='function')window.ARK_CLOUD.saveCrafting(state).catch(()=>{});
  }
  function replaceState(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return;
    state=value;compactState();localStorage.setItem(KEY,JSON.stringify(state));if(active)render();
  }
  window.addEventListener('arkguia-cloud-loaded',e=>{const crafting=e.detail&&e.detail.crafting;if(crafting&&typeof crafting==='object'&&!Array.isArray(crafting))replaceState(crafting);else if(active)setTimeout(render,0);});
  if(window.ARK_CLOUD&&window.ARK_CLOUD.initialCrafting)replaceState(window.ARK_CLOUD.initialCrafting);

  const style=document.createElement('style');
  style.textContent=`
    .craftTools{display:none;grid-template-columns:minmax(0,1fr) minmax(160px,240px);gap:9px;margin-bottom:12px}.craftTools.active{display:grid}.craftCard{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:15px;cursor:pointer}.craftCard.activePlan{border-color:#2c8652;background:linear-gradient(145deg,#112d22,#101d2d)}.craftCard h3{margin:0 0 4px;font-size:17px}.craftTop{display:flex;justify-content:space-between;gap:10px}.craftProgress{margin-top:9px;font-size:12px;color:var(--muted)}.craftProgress strong{color:var(--text)}.craftBadge{display:inline-block;padding:4px 8px;border-radius:999px;background:#0a1422;border:1px solid var(--line);font-size:10px;white-space:nowrap}.ingredientRow{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #203244}.ingredientRow:last-child{border-bottom:0}.ingredientNeed{font-size:13px;color:var(--muted);margin-top:3px}.ingredientNeed.ok{color:#76e99f}.ingredientNeed.miss{color:#ffb2a8}.ownedInput{width:100%;background:#08111d;border:1px solid var(--line);border-radius:12px;padding:10px;color:var(--text);text-align:center}.qtyBox{display:grid;grid-template-columns:1fr 96px;gap:10px;align-items:center;margin:10px 0}.craftSummary{background:#0a1421;border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0}.craftSummary.ready{border-color:#2c8652;background:#0c1d16}.secondaryBtn,.loadMoreCraft{width:100%;border:1px solid var(--line);border-radius:14px;background:#162940;color:var(--text);font-weight:800;padding:12px;margin-top:8px}.loadMoreCraft{grid-column:1/-1;margin:6px 0 0}.catalogNote{font-size:11px;color:var(--muted);margin:-3px 0 10px}.craftOriginal{font-size:11px;color:#7890aa;overflow-wrap:anywhere}@media(max-width:520px){.craftTools{grid-template-columns:1fr}.ingredientRow{grid-template-columns:1fr 84px}.qtyBox{grid-template-columns:1fr 88px}}
  `;
  document.head.appendChild(style);

  modeSwitch.style.gridTemplateColumns='repeat(3,1fr)';
  const craftBtn=document.createElement('button');craftBtn.className='modeBtn';craftBtn.dataset.mode='crafting';craftBtn.textContent='🛠️ Criador';modeSwitch.appendChild(craftBtn);

  const craftTools=document.createElement('section');craftTools.className='craftTools';craftTools.innerHTML='<input id="craftSearch" class="field" placeholder="🔎 Buscar qualquer item do jogo..."><select id="craftCategory" class="field"><option value="all">Todas as categorias</option></select>';
  count.before(craftTools);
  const categorySelect=$('#craftCategory');
  const categories=[...new Set(recipes.map(r=>r.categoria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  for(const cat of categories){const op=document.createElement('option');op.value=cat;op.textContent=cat;categorySelect.appendChild(op);}

  const dialog=document.createElement('dialog');dialog.id='craftDialog';dialog.innerHTML='<div class="modalHead"><div><div class="small" id="craftCategoryLabel"></div><h2 id="craftName"></h2><div id="craftOriginal" class="craftOriginal"></div></div><button class="close" id="closeCraft">✕</button></div><div class="modalBody"><div class="qtyBox"><div><b>Quantidade que quero fabricar</b><div class="meta">A lista recalcula automaticamente.</div></div><input id="craftQty" class="ownedInput" type="number" min="1" step="1" value="1"></div><div id="craftStation" class="info"></div><div id="craftIngredients" class="info"></div><div id="craftSummary" class="craftSummary"></div><button id="clearCraft" class="secondaryBtn">Limpar quantidades que já tenho</button></div>';
  document.body.appendChild(dialog);$('#closeCraft').onclick=()=>dialog.close();

  const icon={Sela:'🪑','Arma / Ferramenta':'⚔️','Munição':'🎯',Armadura:'🛡️',Estrutura:'🏠',Recurso:'🧱',Consumível:'🧪',Acessório:'🔧',Cosmético:'🎨',Tek:'⚡',Outros:'🛠️'};
  function recipeProgress(recipe){const p=readPlan(recipe.id);let ok=0;for(const [name,base] of recipe.ingredientes){const need=Number(base)*p.quantity,have=Math.max(0,Number(p.owned[name])||0);if(have>=need)ok++;}return{ok,total:recipe.ingredientes.length,ready:ok===recipe.ingredientes.length};}
  function filteredRecipes(){const q=($('#craftSearch').value||'').trim().toLocaleLowerCase('pt-BR');const cat=categorySelect.value;return recipes.filter(r=>(cat==='all'||r.categoria===cat)&&(!q||(`${r.nome||''} ${r.original||''} ${r.estacao||''} ${(r.ingredientes||[]).map(x=>x[0]).join(' ')}`).toLocaleLowerCase('pt-BR').includes(q)));}
  function render(){
    if(!active)return;
    const arr=filteredRecipes();const shown=arr.slice(0,visibleLimit);
    const planned=Object.keys(state).length;
    count.textContent=`${arr.length} receitas encontradas • ${recipes.length} itens fabricáveis no catálogo${planned?' • '+planned+' planejamento(s) salvo(s)':''}.`;
    list.innerHTML='';
    if(!arr.length){list.innerHTML='<div class="empty">Nenhuma receita encontrada.</div>';return;}
    for(const r of shown){const prog=recipeProgress(r),p=readPlan(r.id),el=document.createElement('article');el.className='craftCard'+(hasPlan(r.id)?' activePlan':'');el.innerHTML=`<div class="craftTop"><div><h3>${icon[r.categoria]||'🛠️'} ${r.nome}</h3><div class="craftOriginal">${r.original&&r.original!==r.nome?r.original:''}</div></div><span class="craftBadge">${r.categoria||'Item'}</span></div><div class="meta">${r.estacao||'Estação indicada no jogo'}</div><div class="craftProgress">Planejado: <strong>${p.quantity}x</strong> • Materiais completos: <strong>${prog.ok}/${prog.total}</strong>${prog.ready?' • ✅ pronto':''}</div>`;el.onclick=()=>openRecipe(r);list.appendChild(el);}
    if(shown.length<arr.length){const more=document.createElement('button');more.className='loadMoreCraft';more.textContent=`Mostrar mais (${arr.length-shown.length} restantes)`;more.onclick=()=>{visibleLimit+=PAGE_SIZE;render();};list.appendChild(more);}
  }
  function openRecipe(recipe){
    current=recipe;const p=editPlan(recipe.id);$('#craftCategoryLabel').textContent=recipe.categoria||'Item';$('#craftName').textContent=recipe.nome;$('#craftOriginal').textContent=recipe.original&&recipe.original!==recipe.nome?'No jogo: '+recipe.original:'';$('#craftQty').value=p.quantity;$('#craftStation').innerHTML=`<b>🏗️ Onde fabricar</b><div class="meta">${recipe.estacao||'Consulte a estação indicada no engrama/blueprint.'}</div>`;renderIngredients();dialog.showModal();
  }
  function renderIngredients(){
    if(!current)return;const p=editPlan(current.id),box=$('#craftIngredients');box.innerHTML='<b>📦 Materiais</b>';let complete=0;
    for(const [name,baseRaw] of current.ingredientes){const base=Number(baseRaw)||0,need=base*p.quantity,have=Math.max(0,Number(p.owned[name])||0),missing=Math.max(0,need-have);if(missing===0)complete++;const row=document.createElement('div');row.className='ingredientRow';row.innerHTML=`<div><strong>${name}</strong><div class="ingredientNeed ${missing===0?'ok':'miss'}">Precisa ${formatQty(need)} • ${missing===0?'✓ quantidade suficiente':'Faltam '+formatQty(missing)}</div></div><input class="ownedInput" type="number" min="0" step="1" inputmode="numeric" value="${have}" aria-label="Quantidade de ${name} que já tenho">`;const input=row.querySelector('input');input.oninput=()=>{p.owned[name]=Math.max(0,Number(input.value)||0);saveState();renderIngredients();};box.appendChild(row);}
    const summary=$('#craftSummary'),ready=complete===current.ingredientes.length;summary.className='craftSummary'+(ready?' ready':'');summary.innerHTML=ready?'<b>✅ Você já tem todos os materiais</b><div class="meta">Pode fabricar a quantidade planejada.</div>':`<b>🧭 Ainda falta material</b><div class="meta">${complete} de ${current.ingredientes.length} tipos de material completos. Os valores em vermelho mostram exatamente o que falta.</div>`;
  }
  function formatQty(v){return Number.isInteger(v)?String(v):Number(v.toFixed(2)).toString();}

  $('#craftQty').oninput=()=>{if(!current)return;const p=editPlan(current.id);p.quantity=Math.max(1,Number($('#craftQty').value)||1);saveState();renderIngredients();};
  $('#clearCraft').onclick=()=>{if(!current)return;delete state[current.id];saveState();const p=editPlan(current.id);$('#craftQty').value=p.quantity;renderIngredients();render();};
  $('#craftSearch').addEventListener('input',()=>{visibleLimit=PAGE_SIZE;render();});categorySelect.addEventListener('change',()=>{visibleLimit=PAGE_SIZE;render();});

  function enterCrafting(){active=true;visibleLimit=PAGE_SIZE;document.querySelectorAll('.modeBtn').forEach(b=>b.classList.toggle('active',b===craftBtn));tools.style.display='none';tabs.style.display='none';craftTools.classList.add('active');render();}
  craftBtn.onclick=enterCrafting;
  modeSwitch.querySelectorAll('.modeBtn').forEach(btn=>{if(btn===craftBtn)return;btn.addEventListener('click',()=>{active=false;craftTools.classList.remove('active');tools.style.display='grid';});});

  if(!recipes.length){craftBtn.disabled=true;craftBtn.title='Catálogo de criação não carregado';}
  if(meta.totalCraftableRecipes&&meta.totalCraftableRecipes!==recipes.length)console.warn('ArkGuia: catálogo de criação incompleto na memória.');
})();
