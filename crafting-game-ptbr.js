(function(){
'use strict';
const pt=window.ARK_CRAFTING_PTBR;
if(!pt)return;

// Nomes usados no ARK em pt-BR. Esta camada existe para corrigir diferenças
// entre a tradução genérica do catálogo e o texto que o jogador vê no jogo.
const GAME_NAMES={
  'Small Crop Plot':'Caixa de Plantio Pequena',
  'Medium Crop Plot':'Caixa de Plantio Média',
  'Large Crop Plot':'Caixa de Plantio Grande',
  'Tek Crop Plot':'Caixa de Plantio Tek'
};

const SEARCH_ALIASES={
  'Small Crop Plot':['caixa de plantio','plantio','canteiro','caixa de cultivo'],
  'Medium Crop Plot':['caixa de plantio','plantio','canteiro','caixa de cultivo'],
  'Large Crop Plot':['caixa de plantio','plantio','canteiro','caixa de cultivo'],
  'Tek Crop Plot':['caixa de plantio','plantio','canteiro','caixa de cultivo','plantio tek']
};

const baseTranslateName=typeof pt.translateName==='function'?pt.translateName.bind(pt):(name=>name);
pt.translateName=function(name){
  const key=String(name||'').trim();
  return GAME_NAMES[key]||baseTranslateName(key);
};

for(const r of (window.ARK_CRAFTING_RECIPES||[])){
  const original=String(r.original||r.nome||'').trim();
  if(SEARCH_ALIASES[original])r.ptbrAliases=SEARCH_ALIASES[original].slice();
}

window.ARK_CRAFTING_GAME_PTBR={GAME_NAMES,SEARCH_ALIASES};
})();
