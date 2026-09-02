(function(){
  'use strict';
  const byOriginal=new Map((window.ARK_CREATURES||[]).map(c=>[c.original,c]));
  function upsertResource(original,name,stars,rank){const c=byOriginal.get(original);if(!c)return;c.servicos=c.servicos||{funcoes:[],recursos:[],detalhe:''};c.servicos.recursos=Array.isArray(c.servicos.recursos)?c.servicos.recursos:[];const current=c.servicos.recursos.find(r=>r[0]===name);if(current){current[1]=Math.max(current[1]||0,stars);if(rank)current[2]=rank;}else c.servicos.recursos.push([name,stars,rank||null]);}
  upsertResource('Anglerfish','Pérola de Sílica',5,1);

  const M=(icon,how,sources=[],drops=[])=>({icon,how,sources,drops,hint:how});
  window.ARK_RESOURCE_META={
    'Pérola de Sílica':M('🫧','Colete os nós/conchas de pérola no fundo de rios, lagos e principalmente no oceano. O Peixe-pescador é uma das melhores opções para colher em grande quantidade.',['Nós de pérola submersos','Conchas no fundo da água'],['Algumas criaturas aquáticas podem fornecer pequenas quantidades em situações específicas.']),
    'Pasta de cimento':M('🧱','Você pode fabricar no Pilão/Química usando Quitina ou Queratina + Pedra. Também pode obter diretamente em barragens de Castoroides e com criaturas especializadas como o Beelzebufo ao matar insetos.',['Barragens de Castoroides','Fabricação com Quitina/Queratina + Pedra'],['Beelzebufo produz ao matar insetos']),
    'Pasta de Achatina':M('🐌','É produzida passivamente pela Achatina domesticada. Funciona como substituta da Pasta de Cimento em muitas receitas.',['Inventário da Achatina domesticada'],[]),
    'Metal':M('⛏️','Minere rochas metálicas, normalmente douradas/cinzentas e mais densas. Ankylosaurus é excelente para isso.',['Rochas de metal','Pedras comuns em menor quantidade'],[]),
    'Pedra':M('🪨','Quebre pedras e rochas espalhadas pelo mapa. Doedicurus é o coletor especializado.',['Pedras e rochas'],[]),
    'Sílex':M('✨','Golpeie pedras, especialmente com Picareta ou Ankylosaurus.',['Pedras e rochas'],[]),
    'Cristal':M('💎','Minere formações de cristal, comuns em montanhas, cavernas e regiões frias.',['Nós de cristal'],[]),
    'Madeira':M('🪵','Colete em árvores. Castoroides, Mammoth e Therizinosaur são excelentes opções.',['Árvores'],[]),
    'Palha':M('🌾','Colete em árvores; algumas criaturas conseguem priorizar palha com ataques específicos.',['Árvores'],[]),
    'Fibra':M('🌿','Colete plantas e arbustos. Therizinosaur, Gigantopithecus e Moschops são ótimos.',['Plantas e arbustos'],[]),
    'Frutas':M('🫐','Colete arbustos e plantas. Herbívoros grandes conseguem colher muitas de uma vez.',['Arbustos e plantas'],[]),
    'Frutas e sementes':M('🌱','Colete vegetação. Certas criaturas também obtêm sementes junto das frutas.',['Arbustos, plantas e plantações'],[]),
    'Sementes':M('🌱','Colete plantas ou use criaturas como Iguanodon, que pode transformar frutas em sementes.',['Plantas e arbustos','Conversão de frutas com Iguanodon'],[]),
    'Flores raras':M('🌸','São coletadas em plantas específicas de pântanos, margens, montanhas e outros pontos especiais.',['Plantas especiais','Algumas moitas de regiões específicas'],[]),
    'Cogumelos raros':M('🍄','Podem ser obtidos de cristais e plantas/cogumelos específicos, dependendo da região do mapa.',['Cristais específicos','Cogumelos e plantas especiais'],[]),
    'Cogumelos':M('🍄','Colete cogumelos e vegetação apropriada em áreas úmidas, cavernas ou biomas de Aberração.',['Cogumelos e vegetação específica'],[]),
    'Polímero orgânico':M('🧪','É obtido principalmente ao matar e colher certas criaturas, como Kairuku, ou de fontes orgânicas específicas. Estraga com o tempo.',['Fontes orgânicas específicas'],['Kairuku é uma fonte clássica de Polímero Orgânico']),
    'Quitina':M('🪲','Colha o corpo de criaturas com exoesqueleto. Megatherium é excelente para farmar grandes quantidades.',['Corpos de insetos e artrópodes'],['Araneo','Pulmonoscorpius','Titanomyrma e outros insetos']),
    'Couro':M('🦬','Colha cadáveres de muitas criaturas terrestres. Ferramentas e dinos carnívoros aumentam o rendimento.',['Cadáveres de criaturas'],['Grande parte dos animais terrestres']),
    'Carne':M('🥩','Colha cadáveres de criaturas. Carnívoros grandes são ótimos para farm em massa.',['Cadáveres de criaturas'],['A maioria das criaturas com carne']),
    'Peixe':M('🐟','Mate e colha peixes e outras criaturas aquáticas que fornecem carne de peixe.',['Rios, lagos e oceano'],['Coelacanth','Sabertooth Salmon e outros peixes']),
    'Óleo':M('🛢️','Para FARMAR óleo em quantidade, minere nós de óleo com ferramenta ou criatura apropriada. O Basilosaurus NÃO coleta veios: ele apenas produz óleo passivamente no próprio inventário depois de domesticado e adulto.',['Nós de óleo submarinos','Dunkleosteus ou Ankylosaurus para mineração, conforme o local','Produção passiva no inventário de Basilosaurus/Tusoteuthis'],['Basilosaurus: produz passivamente até 20 unidades; não precisa de sela para produzir','Tusoteuthis: também produz passivamente','Besouro de Esterco: pode produzir óleo ao processar fezes']),
    'Mel':M('🍯','É obtido de colmeias de Abelha Gigante. O Dire Bear ajuda a coletar com mais segurança e eficiência.',['Colmeias de Abelha Gigante'],[]),
    'Areia':M('🏜️','Colete em rochas e depósitos apropriados de regiões desérticas. Doedicurus pode ajudar.',['Rochas/depósitos de áreas desérticas'],[]),
    'Seiva de cacto':M('🌵','Colete cactos em regiões áridas/desérticas usando ferramenta ou criatura adequada.',['Cactos'],[]),
    'Bolsas de sangue':M('🩸','Podem ser obtidas com ferramentas/mecânicas de extração de sangue; Desmodus é especializado nesse recurso.',['Extração de sangue'],['Desmodus facilita a obtenção']),
    'Queratina':M('🦴','Colha criaturas com chifres, cascos ou estruturas rígidas. Pode substituir Quitina em algumas receitas, inclusive Pasta de Cimento.',['Cadáveres de criaturas específicas'],['Triceratops','Carbonemys e outras criaturas com estruturas rígidas'])
  };
})();