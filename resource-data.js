(function(){
  'use strict';
  // Complementos específicos para a visão por recursos.
  // Mantemos estes dados separados para não misturar catálogo de criaturas com eficiência de coleta.
  const byOriginal=new Map((window.ARK_CREATURES||[]).map(c=>[c.original,c]));

  function upsertResource(original,name,stars,rank){
    const c=byOriginal.get(original);
    if(!c) return;
    c.servicos=c.servicos||{funcoes:[],recursos:[],detalhe:''};
    c.servicos.recursos=Array.isArray(c.servicos.recursos)?c.servicos.recursos:[];
    const current=c.servicos.recursos.find(r=>r[0]===name);
    if(current){current[1]=Math.max(current[1]||0,stars);if(rank)current[2]=rank;}
    else c.servicos.recursos.push([name,stars,rank||null]);
  }

  // Anglerfish é o coletor especializado para nós de Pérola de Sílica no fundo do mar.
  upsertResource('Anglerfish','Pérola de Sílica',5,1);

  window.ARK_RESOURCE_META={
    'Pérola de Sílica':{icon:'🫧',hint:'Procure os nós de pérola no fundo do mar e use o Peixe-pescador para colher grandes quantidades.'},
    'Metal':{icon:'⛏️'},'Pedra':{icon:'🪨'},'Sílex':{icon:'✨'},'Cristal':{icon:'💎'},
    'Madeira':{icon:'🪵'},'Palha':{icon:'🌾'},'Fibra':{icon:'🌿'},'Frutas':{icon:'🫐'},
    'Frutas e sementes':{icon:'🌱'},'Sementes':{icon:'🌱'},'Flores raras':{icon:'🌸'},
    'Cogumelos raros':{icon:'🍄'},'Cogumelos':{icon:'🍄'},'Polímero orgânico':{icon:'🧪'},
    'Pasta de cimento':{icon:'🧱'},'Pasta de Achatina':{icon:'🐌'},'Quitina':{icon:'🪲'},
    'Couro':{icon:'🦬'},'Carne':{icon:'🥩'},'Peixe':{icon:'🐟'},'Óleo':{icon:'🛢️'},
    'Mel':{icon:'🍯'},'Areia':{icon:'🏜️'},'Seiva de cacto':{icon:'🌵'},'Bolsas de sangue':{icon:'🩸'}
  };
})();
