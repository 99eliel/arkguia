(function(){
  'use strict';
  const LOCAL_KEY='arkguia-astraeos-v2';
  const DEVICE_KEY='arkguia-cloud-device-id';

  function localDone(){
    try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}
  }
  function getDeviceId(){
    let id=localStorage.getItem(DEVICE_KEY);
    if(!id){id=(crypto.randomUUID?crypto.randomUUID():'device-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(DEVICE_KEY,id);}
    return id;
  }
  function emit(done,extra={}){
    const values=Array.isArray(done)?done:[];
    window.ARK_CLOUD.initialDone=values;
    window.dispatchEvent(new CustomEvent('arkguia-cloud-loaded',{detail:{done:values,authoritative:true,...extra}}));
  }

  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  window.ARK_CLOUD={enabled:false,state:'starting',source:'firebase',initialDone:null,ready,save:async()=>false};

  if(!window.firebase||!firebase.initializeApp||!firebase.firestore||!firebase.auth){
    window.ARK_CLOUD.state='unavailable';resolveReady(false);return;
  }

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

    async function save(done){
      if(!ref) return false;
      const values=Array.isArray(done)?done:localDone();
      const payload={done:values,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:2};
      queue=queue.then(()=>ref.set(payload,{merge:true})).then(()=>true).catch(()=>false);
      return queue;
    }

    window.ARK_CLOUD.save=save;

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
        emit(Array.isArray(data.done)?data.done:[],{migrated:false});
      }else{
        const legacy=await legacyRef.get();
        if(legacy.exists){
          const data=legacy.data()||{};
          const values=Array.isArray(data.done)?data.done:[];
          await ref.set({done:values,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:2,migratedFrom:'legacy-device-document'},{merge:true});
          emit(values,{migrated:true});
        }else{
          const values=localDone();
          await ref.set({done:values,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:2,createdFrom:'local-backup'},{merge:true});
          emit(values,{seeded:true});
        }
      }

      window.ARK_CLOUD.state='ready';
      resolveReady(true);

      ref.onSnapshot(snapshot=>{
        if(!snapshot.exists) return;
        const data=snapshot.data()||{};
        if(Array.isArray(data.done)) emit(data.done,{live:true});
      },()=>{window.ARK_CLOUD.state='offline';});
      return true;
    }).catch(()=>{
      window.ARK_CLOUD.enabled=false;
      window.ARK_CLOUD.state='offline';
      resolveReady(false);
    });
  }catch(_){
    window.ARK_CLOUD.enabled=false;
    window.ARK_CLOUD.state='unavailable';
    resolveReady(false);
  }
})();
