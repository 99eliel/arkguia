(function(){
  'use strict';
  const LOCAL_KEY='arkguia-astraeos-v2';
  const CRAFT_KEY='arkguia-crafting-v1';

  function localDone(){try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_){return [];}}
  function localCrafting(){try{const v=JSON.parse(localStorage.getItem(CRAFT_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return {};}}
  function emit(done,crafting,extra={}){
    const values=Array.isArray(done)?done:[];
    const craft=crafting&&typeof crafting==='object'&&!Array.isArray(crafting)?crafting:{};
    window.ARK_CLOUD.initialDone=values;
    window.ARK_CLOUD.initialCrafting=craft;
    window.dispatchEvent(new CustomEvent('arkguia-cloud-loaded',{detail:{done:values,crafting:craft,authoritative:true,...extra}}));
  }

  let resolveReady;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  let readyResolved=false;
  function finishReady(value){if(!readyResolved){readyResolved=true;resolveReady(value);}}

  window.ARK_CLOUD={enabled:false,state:'starting',source:'firebase',initialDone:null,initialCrafting:null,ready,save:async()=>false,saveCrafting:async()=>false,user:null};

  if(!window.firebase||!firebase.initializeApp||!firebase.firestore||!firebase.auth){window.ARK_CLOUD.state='unavailable';finishReady(false);return;}

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
    const auth=firebase.auth();
    let ref=null;
    let currentUid=null;
    let stopSnapshot=null;
    let queue=Promise.resolve();

    function enqueue(payload){
      if(!ref) return Promise.resolve(false);
      queue=queue.then(()=>ref.set({...payload,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:4},{merge:true})).then(()=>true).catch(()=>false);
      return queue;
    }
    window.ARK_CLOUD.save=async done=>enqueue({done:Array.isArray(done)?done:localDone()});
    window.ARK_CLOUD.saveCrafting=async crafting=>enqueue({crafting:crafting&&typeof crafting==='object'&&!Array.isArray(crafting)?crafting:localCrafting()});

    async function attachUser(user){
      if(!user)return;
      window.ARK_CLOUD.user=user;
      window.ARK_CLOUD.uid=user.uid;
      window.ARK_CLOUD.isAnonymous=!!user.isAnonymous;
      window.ARK_CLOUD.enabled=true;
      window.ARK_CLOUD.state='loading';
      window.dispatchEvent(new CustomEvent('arkguia-auth-changed',{detail:{user}}));
      if(currentUid===user.uid&&ref)return;
      currentUid=user.uid;
      if(stopSnapshot){stopSnapshot();stopSnapshot=null;}
      ref=db.collection('arkguia_progress').doc(user.uid);

      const snap=await ref.get();
      if(snap.exists){
        const data=snap.data()||{};
        const done=Array.isArray(data.done)?data.done:[];
        const crafting=data.crafting&&typeof data.crafting==='object'&&!Array.isArray(data.crafting)?data.crafting:{};
        emit(done,crafting,{account:!user.isAnonymous,seeded:false});
      }else{
        const done=localDone(),crafting=localCrafting();
        await ref.set({done,crafting,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp(),catalog:'astraeos',schema:4,accountType:user.isAnonymous?'guest':'registered'},{merge:true});
        emit(done,crafting,{account:!user.isAnonymous,seeded:true});
      }

      window.ARK_CLOUD.state='ready';finishReady(true);
      stopSnapshot=ref.onSnapshot(snapshot=>{
        if(!snapshot.exists)return;
        const data=snapshot.data()||{};
        emit(Array.isArray(data.done)?data.done:[],data.crafting&&typeof data.crafting==='object'&&!Array.isArray(data.crafting)?data.crafting:{},{live:true,account:!user.isAnonymous});
      },()=>{window.ARK_CLOUD.state='offline';});
    }

    auth.onAuthStateChanged(user=>{
      if(user){attachUser(user).catch(()=>{window.ARK_CLOUD.state='offline';finishReady(false);});}
      else{
        currentUid=null;ref=null;if(stopSnapshot){stopSnapshot();stopSnapshot=null;}
        window.ARK_CLOUD.user=null;
        window.dispatchEvent(new CustomEvent('arkguia-auth-changed',{detail:{user:null}}));
        auth.signInAnonymously().catch(()=>{window.ARK_CLOUD.enabled=false;window.ARK_CLOUD.state='offline';finishReady(false);});
      }
    });
  }catch(_){window.ARK_CLOUD.enabled=false;window.ARK_CLOUD.state='unavailable';finishReady(false);}
})();
