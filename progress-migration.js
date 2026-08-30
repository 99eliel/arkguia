(function(){
  const CURRENT='arkguia-astraeos-v2';
  const LEGACY='arkguia-astraeos-v1';
  const BACKUP='arkguia-astraeos-backup';
  const oldNames=['Achatina','Acrocanthosaurus','Allosaurus','Ankylosaurus','Araneo','Archaeopteryx','Argentavis','Baryonyx','Basilosaurus','Beelzebufo','Boaratos','Brontosaurus','Carbonemys','Carnotaurus','Carcharodontosaurus','Ceratosaurus','Chalicotherium','Daeodon','Deinonychus','Deinosuchus','Deinotherium','Dilophosaur','Dimetrodon','Dimorphodon','Diplocaulus','Diplodocus','Dire Bear','Direwolf','Dodo','Doedicurus','Dung Beetle','Electrophorus','Equus','Gallimimus','Gasbags','Giganotosaurus','Gigantopithecus','Gigantoraptor','Grand Tortugar','Hyaenodon','Ichthyosaurus','Iguanodon','Kairuku','Kaprosuchus','Karkinos','Kentrosaurus','Lymantria','Lystrosaurus','Maeguana','Mammoth','Managarmr','Manta','Mantis','Megalania','Megaloceros','Megalodon','Megalosaurus','Megatherium','Mesopithecus','Moschops','Mosasaurus','Oasisaur','Otter','Oviraptor','Ovis','Pachy','Pachyrhinosaurus','Paraceratherium','Parasaur','Pegomastax','Phiomia','Phoenix','Plesiosaur','Procoptodon','Pteranodon','Pulmonoscorpius','Purlovia','Pyromane','Quetzal','Raptor','Ravager','Rex','Rock Drake','Rock Elemental','Sabertooth','Sarco','Snow Owl','Spino','Stegosaurus','Tapejara','Terror Bird','Therizinosaur','Thorny Dragon','Thylacoleo','Triceratops','Tusoteuthis','Velonasaur','Vulture','Woolly Rhino','Wyvern de Fogo','Wyvern de Gelo','Wyvern de Lightning','Wyvern de Veneno','Yutyrannus'];
  function read(k){try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  const current=read(CURRENT);
  const validIds=new Set((window.ARK_CREATURES||[]).map(c=>c.id));
  const byOriginal=new Map((window.ARK_CREATURES||[]).filter(c=>c.variante==='Normal').map(c=>[c.original,c.id]));
  const merged=new Set(current.filter(id=>validIds.has(id)));
  const legacy=read(LEGACY);
  for(const oldId of legacy){
    const n=Number(oldId);
    if(!Number.isInteger(n)||n<1||n>oldNames.length) continue;
    const name=oldNames[n-1];
    const id=byOriginal.get(name);
    if(id) merged.add(id);
  }
  const final=[...merged];
  write(CURRENT,final);
  write(BACKUP,{savedAt:new Date().toISOString(),key:CURRENT,done:final});
  window.ARK_PROGRESS_STORAGE={current:CURRENT,legacy:LEGACY,backup:BACKUP,recovered:Math.max(0,final.length-current.length)};
})();