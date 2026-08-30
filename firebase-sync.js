(function(){
  'use strict';
  const LOCAL_KEY='arkguia-astraeos-v2';
  const DEVICE_KEY='arkguia-cloud-device-id';
  function getDeviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id=(crypto.randomUUID?crypto.randomUUID():'device-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE_KEY,id);}
    return id;
  }
  function localDone(){try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
  window.ARK_CLOUD={enabled:false,save:async()=>false};
  if(!window.firebase||!firebase.initializeApp||!firebase.firestore) return;
  try{
    const firebaseConfig={
      apiKey:'AIzaSyCaQd6toPJKf8mGjb7yUrWULDBYn23RQEM',
      authDomain:'upa-pesquisa.firebaseapp.com',
      projectId:'upa-pesquisa',
      storageBucket:'upa-pesquisa.firebasestorage.app',
      messagingSenderId:'41005218637',
      appId:'1:41005218637:web:3a96275bae64ebeafc1504',
      measurementId:'G-RY2T0WS6M2'
    };
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db=firebase.firestore();
    const ref=db.collection('arkguia_progress').doc(getDeviceId());
    let queue=Promise.resolve();
    async function save(done){
      const payload={done:Array.isArray(done)?done:localDone(),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),deviceId:getDeviceId(),catalog:'astraeos'};
      queue=queue.then(()=>ref.set(payload,{merge:true})).catch(()=>false);
      return queue;
    }
    window.ARK_CLOUD={enabled:true,deviceId:getDeviceId(),save};
    ref.get().then(snap=>{
      if(snap.exists){const data=snap.data()||{};if(Array.isArray(data.done)) window.dispatchEvent(new CustomEvent('arkguia-cloud-loaded',{detail:{done:data.done}}));}
      return save(localDone());
    }).catch(()=>{});
  }catch(_){window.ARK_CLOUD={enabled:false,save:async()=>false};}
})();
