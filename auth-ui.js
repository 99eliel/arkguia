(function(){
'use strict';
if(!window.firebase||!firebase.auth)return;
const auth=firebase.auth();
const $=s=>document.querySelector(s);

// Limpeza estrutural: deve existir somente um botão de conta e um diálogo de autenticação.
const accountButtons=[...document.querySelectorAll('.accountBtn')];
let btn=accountButtons.shift()||null;
accountButtons.forEach(el=>el.remove());
const authDialogs=[...document.querySelectorAll('#authDialog')];
let dlg=authDialogs.shift()||null;
authDialogs.forEach(el=>el.remove());

// Se o módulo já foi executado nesta página, a limpeza acima é suficiente.
if(window.__ARK_AUTH_UI_LOADED__)return;
window.__ARK_AUTH_UI_LOADED__=true;

let style=$('#authUiStyles');
if(!style){
  style=document.createElement('style');
  style.id='authUiStyles';
  style.textContent=`
.accountBtn{margin-left:auto;border:1px solid var(--line);background:#10253b;color:#dbe9f7;border-radius:14px;padding:10px 13px;font-weight:800;white-space:nowrap;max-width:min(42vw,360px);overflow:hidden;text-overflow:ellipsis}.accountBtn.registered{border-color:#2c8652;background:#112d22;color:#b8ffd0}.authBody{padding:0 18px 18px}.authTabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 14px}.authTab{border:1px solid var(--line);background:#101d2d;color:var(--muted);padding:11px;border-radius:12px;font-weight:800}.authTab.active{background:#173a2a;color:#b8ffd0;border-color:#2c8652}.authForm{display:grid;gap:10px}.authInput{width:100%;background:#08111d;border:1px solid var(--line);border-radius:12px;padding:12px;color:var(--text)}.authAction{width:100%;border:0;border-radius:13px;background:var(--accent);color:#062314;font-weight:850;padding:13px}.authGoogle{width:100%;border:1px solid var(--line);border-radius:13px;background:#162940;color:var(--text);font-weight:800;padding:13px;margin-top:10px}.authDivider{text-align:center;color:var(--muted);font-size:12px;margin:12px 0}.authMsg{font-size:13px;line-height:1.4;min-height:18px;margin-top:7px}.authMsg.err{color:#ffaaa2}.authMsg.ok{color:#8de8ab}.accountCard{background:#0a1421;border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}.signOutBtn{width:100%;border:1px solid #704244;background:#24191a;color:#ffb8b8;border-radius:13px;padding:12px;font-weight:800}.guestNote{font-size:12px;color:var(--muted);line-height:1.45;margin-top:9px}@media(max-width:600px){.accountBtn{padding:9px 10px;font-size:12px;max-width:42vw}.hero{align-items:flex-start}}
`;
  document.head.appendChild(style);
}

const hero=$('.hero');
if(!btn){btn=document.createElement('button');btn.className='accountBtn';btn.type='button';hero&&hero.appendChild(btn);}
btn.id='accountBtn';
btn.type='button';

if(!dlg){
  dlg=document.createElement('dialog');
  dlg.id='authDialog';
  dlg.innerHTML=`<div class="modalHead"><div><div class="small">ArkGuia</div><h2 id="authTitle">Sua conta</h2></div><button class="close" type="button" aria-label="Fechar">✕</button></div><div class="authBody"><div id="authGuest"><div class="authTabs"><button class="authTab active" data-auth-mode="login">Entrar</button><button class="authTab" data-auth-mode="create">Criar conta</button></div><div class="authForm"><input id="authEmail" class="authInput" type="email" autocomplete="email" placeholder="E-mail"><input id="authPassword" class="authInput" type="password" autocomplete="current-password" minlength="6" placeholder="Senha (mínimo 6 caracteres)"><button id="authEmailAction" class="authAction">Entrar</button></div><div class="authDivider">ou</div><button id="authGoogle" class="authGoogle">Continuar com Google</button><div class="guestNote">Ao criar uma conta enquanto você está como convidado, seu progresso atual é vinculado à conta para não perder os dados.</div><div id="authMsg" class="authMsg"></div></div><div id="authAccount" style="display:none"><div class="accountCard"><b id="authAccountName"></b><div id="authAccountEmail" class="meta" style="margin-top:5px"></div><div class="meta" style="margin-top:8px">Seu progresso e seus planejamentos de criação ficam vinculados a esta conta.</div></div><button id="authSignOut" class="signOutBtn">Sair da conta</button><div id="authAccountMsg" class="authMsg"></div></div></div>`;
  document.body.appendChild(dlg);
}

let mode='login';
function setMsg(text,type=''){const el=$('#authMsg');if(!el)return;el.textContent=text||'';el.className='authMsg'+(type?' '+type:'');}
function friendly(err){const c=err&&err.code||'';if(c.includes('wrong-password')||c.includes('invalid-credential')||c.includes('user-not-found'))return'E-mail ou senha incorretos.';if(c.includes('email-already-in-use')||c.includes('credential-already-in-use'))return'Essa conta já existe. Use Entrar.';if(c.includes('weak-password'))return'A senha precisa ter pelo menos 6 caracteres.';if(c.includes('invalid-email'))return'Digite um e-mail válido.';if(c.includes('popup-closed'))return'A janela do Google foi fechada antes de concluir.';if(c.includes('popup-blocked'))return'O navegador bloqueou a janela do Google.';return'Não foi possível concluir agora. Tente novamente.';}
function updateMode(next){mode=next;document.querySelectorAll('[data-auth-mode]').forEach(x=>x.classList.toggle('active',x.dataset.authMode===mode));$('#authEmailAction').textContent=mode==='create'?'Criar conta':'Entrar';$('#authPassword').autocomplete=mode==='create'?'new-password':'current-password';setMsg('');}
function renderUser(user){const registered=!!(user&&!user.isAnonymous);btn.classList.toggle('registered',registered);btn.textContent=registered?'✓ '+(user.displayName||user.email||'Conta'):'👤 Entrar';const guest=$('#authGuest'),account=$('#authAccount');if(guest)guest.style.display=registered?'none':'block';if(account)account.style.display=registered?'block':'none';if(registered){$('#authTitle').textContent='Sua conta';$('#authAccountName').textContent=user.displayName||'Conta ArkGuia';$('#authAccountEmail').textContent=user.email||'Conta conectada';}else $('#authTitle').textContent='Salvar seu progresso';}

btn.onclick=()=>{if(!dlg.open)dlg.showModal();};
dlg.querySelector('.close').onclick=()=>{if(dlg.open)dlg.close();};
document.querySelectorAll('[data-auth-mode]').forEach(x=>x.onclick=()=>updateMode(x.dataset.authMode));

$('#authEmailAction').onclick=async()=>{
  const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
  if(!email||password.length<6){setMsg('Digite o e-mail e uma senha com pelo menos 6 caracteres.','err');return;}
  setMsg('Aguarde...');
  try{
    if(mode==='create'){
      const credential=firebase.auth.EmailAuthProvider.credential(email,password);
      const user=auth.currentUser;
      if(user&&user.isAnonymous)await user.linkWithCredential(credential);else await auth.createUserWithEmailAndPassword(email,password);
      setMsg('Conta criada e progresso preservado.','ok');
    }else await auth.signInWithEmailAndPassword(email,password);
  }catch(err){setMsg(friendly(err),'err');}
};

$('#authGoogle').onclick=async()=>{
  setMsg('Abrindo Google...');
  const provider=new firebase.auth.GoogleAuthProvider();
  try{
    const user=auth.currentUser;
    if(user&&user.isAnonymous)await user.linkWithPopup(provider);else await auth.signInWithPopup(provider);
    setMsg('Conta conectada.','ok');
  }catch(err){
    if(err&&err.code==='auth/popup-blocked'){
      try{const user=auth.currentUser;if(user&&user.isAnonymous)await user.linkWithRedirect(provider);else await auth.signInWithRedirect(provider);return;}catch(e){setMsg(friendly(e),'err');return;}
    }
    setMsg(friendly(err),'err');
  }
};

$('#authSignOut').onclick=async()=>{
  const msg=$('#authAccountMsg');msg.textContent='Saindo...';
  try{
    localStorage.removeItem('arkguia-astraeos-v2');
    localStorage.removeItem('arkguia-crafting-v1');
    localStorage.removeItem('arkguia-astraeos-backup');
    await auth.signOut();
    msg.textContent='';if(dlg.open)dlg.close();location.reload();
  }catch(_){msg.textContent='Não foi possível sair agora.';msg.className='authMsg err';}
};

auth.onAuthStateChanged(renderUser);
window.addEventListener('arkguia-auth-changed',e=>renderUser(e.detail&&e.detail.user));
})();
