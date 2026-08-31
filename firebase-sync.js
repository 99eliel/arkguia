(function(){
  'use strict';
  const LOCAL_KEY='arkguia-astraeos-v2';
  const CRAFT_KEY='arkguia-crafting-v1';
  const DEVICE_KEY='arkguia-cloud-device-id';

  function localDone(){try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
  function localCrafting(){try{const v=JSON.parse(localStorage.getItem(CRAFT_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return {};}}
  function getDeviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id=(crypto.randomUUID?crypto.randomUUID():'device-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE_KEY,id);}
    return id;
  }
  function emit(done,crafting,extra={}){
    const values=Array.isArray(done)?done:[];
    const craft=crafting&&typeof crafting==='object'&&!Array.isArray(crafting)?crafting:{};
    window.ARK_CLOUD.initialDone=values;
    window.ARK_CLOUD.initialCrafting=craft;
    window.dispatchEvent(new CustomEvent('arkguia-cloud-loaded',{detail:{done:values,crafting:craft,authoritative:true,...extra}}));
  }

  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  window.ARK_CLOUD={enabled:false,state:'starting',source:'firebase',initialDone:null,initialCrafting:null,ready,save:async()=>false,saveCrafting:async()=>false};

  if(!window.firebase||!firebase.initializeApp||!firebase.firestore||!firebase.auth){window.ARK_CLOUD.state='unavailable';resolveReady(false);return;}

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
    let ref=null;
    let queue=Promise.resolve();

    function enqueue(payload){
      if(!ref) return Promise.resolve(false);
      queue=queue.then(()=>ref.set({...payload,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:3},{merge:true})).then(()=>true).catch(()=>false);
      return queue;
    }
    async function save(done){return enqueue({done:Array.isArray(done)?done:localDone()});}
    async function saveCrafting(crafting){const craft=crafting&&typeof crafting==='object'&&!Array.isArray(crafting)?crafting:localCrafting();return enqueue({crafting:craft});}
    window.ARK_CLOUD.save=save;
    window.ARK_CLOUD.saveCrafting=saveCrafting;

    firebase.auth().signInAnonymously().then(async cred=>{
      const uid=cred.user.uid;
      const deviceId=getDeviceId();
      ref=db.collection('arkguia_progress').doc(uid);
      const legacyRef=db.collection('arkguia_progress').doc(uid+'-'+deviceId);
      window.ARK_CLOUD.enabled=true;
      window.ARK_CLOUD.state='loading';
      window.ARK_CLOUD.uid=uid;

      let snap=await ref.get();
      if(snap.exists){
        const data=snap.data()||{};
        const done=Array.isArray(data.done)?data.done:[];
        let crafting=data.crafting&&typeof data.crafting==='object'&&!Array.isArray(data.crafting)?data.crafting:null;
        if(!crafting){crafting=localCrafting();await ref.set({crafting,schema:3,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
        emit(done,crafting,{migrated:false});
      }else{
        const legacy=await legacyRef.get();
        if(legacy.exists){
          const data=legacy.data()||{};
          const done=Array.isArray(data.done)?data.done:[];
          const crafting=data.crafting&&typeof data.crafting==='object'&&!Array.isArray(data.crafting)?data.crafting:localCrafting();
          await ref.set({done,crafting,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:3,migratedFrom:'legacy-device-document'},{merge:true});
          emit(done,crafting,{migrated:true});
        }else{
          const done=localDone(),crafting=localCrafting();
          await ref.set({done,crafting,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:3,createdFrom:'local-backup'},{merge:true});
          emit(done,crafting,{seeded:true});
        }
      }

      window.ARK_CLOUD.state='ready';resolveReady(true);
      ref.onSnapshot(snapshot=>{
        if(!snapshot.exists)return;
        const data=snapshot.data()||{};
        const done=Array.isArray(data.done)?data.done:[];
        const crafting=data.crafting&&typeof data.crafting==='object'&&!Array.isArray(data.crafting)?data.crafting:{};
        emit(done,crafting,{live:true});
      },()=>{window.ARK_CLOUD.state='offline';});
      return true;
    }).catch(()=>{window.ARK_CLOUD.enabled=false;window.ARK_CLOUD.state='offline';resolveReady(false);});
  }catch(_){window.ARK_CLOUD.enabled=false;window.ARK_CLOUD.state='unavailable';resolveReady(false);}
})();
