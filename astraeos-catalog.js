(function(){
  'use strict';

  const current=Array.isArray(window.ARK_CREATURES)?window.ARK_CREATURES:[];
  if(!current.length||typeof c!=='function')return;

  // O checklist representa a espécie uma única vez. Variantes Aberrantes/Tek/Astrais/etc.
  // não viram uma segunda domesticação no progresso.
  const catalog=current.filter(creature=>!creature.variante||creature.variante==='Normal');
  const known=new Set(catalog.map(creature=>creature.original));

  // Nome exibido deve acompanhar a tradução pt-BR usada dentro do jogo.
  // O campo `original` continua técnico/interno para preservar IDs, busca e integrações.
  const GAME_NAMES_PTBR={
    'Megaloceros':'Alce Gigante'
  };
  for(const creature of catalog){
    if(GAME_NAMES_PTBR[creature.original])creature.nome=GAME_NAMES_PTBR[creature.original];
  }

  const additions=[
    ['Celacanto','Coelacanth','Especial','Cesto de Peixe','Aquático','Coloque um Cesto de Peixe no fundo perto dele, espere o cesto ficar pronto e capture o peixe. Ao soltar o Cesto de Peixe preenchido na água, ele fica domesticado.'],
    ['Compy','Compy','Nocaute','Carneiro Cru ou Carne Nobre Crua','Terrestre','É muito frágil e acorda rápido. Deixe a carne pronta antes do nocaute e use pouco dano para não matar.'],
    ['Megaraptor','Megaraptor','Especial','Ração Excepcional ou carne nobre','Terrestre','Encontre o altar do Megaraptor, interaja segurando uma Tocha e acerte o Megaraptor com a tocha quando ele sair da camuflagem para atacar. Repita até ele apagar e então alimente normalmente.'],
    ['Piranha','Piranha','Especial','Cesto de Peixe','Aquático','Coloque um Cesto de Peixe no fundo perto da Piranha, aguarde ele armar e capture. Ao soltar o cesto preenchido na água, a Piranha fica domesticada.'],
    ['Salmão Dente-de-Sabre','Sabertooth Salmon','Especial','Cesto de Peixe','Aquático','Capture com um Cesto de Peixe armado no fundo. Ao soltar o cesto preenchido novamente na água, o salmão fica domesticado.'],
    ['Titanoboa','Titanoboa','Especial','Ovos fertilizados','Caverna','Não deixe a Titanoboa agressiva em você. Solte ovos fertilizados no chão perto dela e deixe-a comer. Ovos maiores dão mais progresso; solte os ovos pelo seu próprio inventário.'],
    ['Titanossauro','Titanosaur','Especial','Canhão/Catapulta + Sela de Plataforma','Terrestre','Acerte a cabeça com Canhão ou projéteis de Catapulta para acumular torpor. Quando ele cair, coloque a Sela de Plataforma no inventário para concluir. Em configurações oficiais/padrão, é uma domesticação temporária porque ele não come depois de domado.'],
    ['Trilobita','Trilobite','Especial','Cesto de Peixe','Aquático','Pode ser capturado e domesticado com Cesto de Peixe. É um tame incomum e o Trilobita pode acabar morrendo de fome mesmo depois de domesticado.'],
    ['Troodonte','Troodon','Especial','Sacrifício de criaturas domesticadas','Terrestre','Deixe o Troodonte matar criaturas que pertencem a você ou à sua tribo para ganhar afinidade de domesticação. À noite a quantidade de experiência exigida cai bastante.']
  ];

  for(const args of additions){
    if(known.has(args[1]))continue;
    const creature=c(...args);
    catalog.push(creature);
    known.add(creature.original);
  }

  catalog.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  window.ARK_CREATURES=catalog;
  window.ARK_ASTRAEOS_CATALOG={
    audited:true,
    speciesOnly:true,
    locale:'pt-BR',
    added:additions.map(x=>x[1]),
    total:catalog.length
  };
})();
