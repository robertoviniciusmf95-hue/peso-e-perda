"use strict";

const KEY_ADMIN_DISHES="pp_admin_dishes_v1";
const KEY_ADMIN_TRAYS="pp_admin_trays_v1";

function isAdmin(){
  return !!session && session.role==="admin";
}

function getAdminDishes(){
  try{
    const data=JSON.parse(safeGet(KEY_ADMIN_DISHES)||"[]");
    return Array.isArray(data)?data:[];
  }catch(e){
    return [];
  }
}

function setAdminDishes(items){
  safeSet(KEY_ADMIN_DISHES,JSON.stringify(items));
}

function getAdminTrays(){
  try{
    const data=JSON.parse(safeGet(KEY_ADMIN_TRAYS)||"[]");
    return Array.isArray(data)?data:[];
  }catch(e){
    return [];
  }
}

function setAdminTrays(items){
  safeSet(KEY_ADMIN_TRAYS,JSON.stringify(items));
}

function allTrayPresets(){
  const base=Array.isArray(TRAYS)?TRAYS:[];
  const custom=getAdminTrays();
  const out=[];
  [...base,...custom].forEach(t=>{
    if(!t || !t.name) return;
    if(!out.some(x=>String(x.name).toLowerCase()===String(t.name).toLowerCase())){
      out.push({name:String(t.name),weight:Number(t.weight||0)});
    }
  });
  return out;
}

function renderCatalogAdmin(){
  if(!isAdmin()) return;

  const dishList=document.getElementById("catalogDishList");
  const trayList=document.getElementById("catalogTrayList");

  if(dishList){
    const dishes=getAdminDishes();
    dishList.innerHTML=dishes.length
      ? dishes.map((d,i)=>`
        <div class="admin-catalog-row">
          <b>${d.name}</b>
          <span>${d.category}</span>
          <div class="admin-catalog-actions">
            <button class="btn small danger" onclick="removeCatalogDish(${i})">Excluir</button>
          </div>
        </div>`).join("")
      : '<div class="desc">Nenhum prato cadastrado pelo ADM.</div>';
  }

  if(trayList){
    const trays=getAdminTrays();
    trayList.innerHTML=trays.length
      ? trays.map((t,i)=>`
        <div class="admin-catalog-row">
          <b>${t.name}</b>
          <span>${Number(t.weight||0).toFixed(3)} kg</span>
          <div class="admin-catalog-actions">
            <button class="btn small danger" onclick="removeCatalogTray(${i})">Excluir</button>
          </div>
        </div>`).join("")
      : '<div class="desc">Nenhuma travessa cadastrada pelo ADM.</div>';
  }
}

function addCatalogDish(){
  if(!isAdmin()) return;

  const nameEl=document.getElementById("catalogDishName");
  const catEl=document.getElementById("catalogDishCategory");
  const msg=document.getElementById("catalogDishMsg");

  const name=(nameEl?.value||"").trim();
  const category=catEl?.value||"Outros";

  if(!name){
    if(msg) msg.textContent="Informe o nome do prato.";
    return;
  }

  const currentMenu=buildMenu();
  const exists=Object.values(currentMenu).flat().some(
    n=>String(n).trim().toLowerCase()===name.toLowerCase()
  );

  if(exists){
    if(msg) msg.textContent="Este prato já existe no sistema.";
    return;
  }

  const list=getAdminDishes();
  list.push({name,category});
  setAdminDishes(list);

  if(nameEl) nameEl.value="";
  if(msg){
    msg.style.color="var(--green)";
    msg.textContent="Prato cadastrado.";
  }

  renderCatalogAdmin();
  renderMenu();
}

function removeCatalogDish(index){
  if(!isAdmin()) return;
  const list=getAdminDishes();
  if(index<0 || index>=list.length) return;

  const item=list[index];
  if(!confirm(`Excluir o prato "${item.name}" do cadastro?`)) return;

  list.splice(index,1);
  setAdminDishes(list);
  renderCatalogAdmin();
  renderMenu();
}

function addCatalogTray(){
  if(!isAdmin()) return;

  const nameEl=document.getElementById("catalogTrayName");
  const weightEl=document.getElementById("catalogTrayWeight");
  const msg=document.getElementById("catalogTrayMsg");

  const name=(nameEl?.value||"").trim();
  const weight=Number(weightEl?.value)||0;

  if(!name){
    if(msg) msg.textContent="Informe o nome da travessa.";
    return;
  }

  if(weight<=0){
    if(msg) msg.textContent="Informe a tara da travessa em kg.";
    return;
  }

  const exists=allTrayPresets().some(
    t=>String(t.name).trim().toLowerCase()===name.toLowerCase()
  );

  if(exists){
    if(msg) msg.textContent="Esta travessa já existe no sistema.";
    return;
  }

  const list=getAdminTrays();
  list.push({name,weight});
  setAdminTrays(list);

  if(nameEl) nameEl.value="";
  if(weightEl) weightEl.value="";
  if(msg){
    msg.style.color="var(--green)";
    msg.textContent="Travessa cadastrada.";
  }

  renderCatalogAdmin();
  if(typeof renderWeights==="function") renderWeights();
}

function removeCatalogTray(index){
  if(!isAdmin()) return;
  const list=getAdminTrays();
  if(index<0 || index>=list.length) return;

  const item=list[index];
  if(!confirm(`Excluir a travessa "${item.name}" do cadastro?`)) return;

  list.splice(index,1);
  setAdminTrays(list);
  renderCatalogAdmin();
  if(typeof renderWeights==="function") renderWeights();
}

(function setupModernLogin(){
  if(window.__modernLoginReady) return;
  window.__modernLoginReady=true;

  const style=document.createElement("link");
  style.rel="stylesheet";
  style.href="login-refresh.css";
  document.head.appendChild(style);

  const auth=document.getElementById("authScreen");
  if(!auth) return;
  const oldLogo=auth.querySelector(".login-logo");
  const logoSrc=oldLogo?.src||"logo://peso-e-perda";

  auth.innerHTML=`
    <div class="login-shell">
      <div class="login-side login-side-left">
        <span>ALIMENTAÇÃO</span><span>CONSCIENTE</span><span>RESULTADOS</span><span>REAIS</span><i class="accent"></i>
      </div>

      <div class="login">
        <div class="login-logo-wrap"><img src="${logoSrc}" alt="Logo Peso e Perda" class="login-logo"></div>
        <div class="login-heading">
          <h1>PESO E PERDA</h1>
          <div class="login-system">SISTEMA</div>
          <p>CONTROLE PARA UM BUFÊ MAIS EFICIENTE</p>
        </div>

        <div class="login-form-wrap">
          <div class="login-field">
            <label for="loginUser">E-mail ou usuário</label>
            <div class="login-input-wrap">
              <span class="login-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>
              </span>
              <input id="loginUser" autocomplete="username" placeholder="Digite seu e-mail ou usuário">
            </div>
          </div>

          <div class="login-field">
            <label for="loginPass">Senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>
              </span>
              <input id="loginPass" type="password" autocomplete="current-password" placeholder="Digite sua senha">
              <button id="togglePassword" class="password-toggle" type="button" aria-label="Mostrar senha" title="Mostrar ou ocultar senha">
                <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg class="icon-eye-off hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"></path><path d="M10.6 10.6a3 3 0 1 0 4.2 4.2"></path><path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a18.7 18.7 0 0 1-3.2 4.2"></path><path d="M6.2 6.2C3.8 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 5.1-1.3"></path></svg>
              </button>
            </div>
          </div>

          <div id="loginMsg" class="msg login-msg"></div>
          <button class="btn primary login-submit" id="loginButton">Entrar</button>
          <div class="login-footer-note"><span class="login-footer-mark"></span><span>Mais controle. Menos desperdício. Mais resultados.</span></div>
        </div>
      </div>

      <div class="login-side login-side-right">
        <div><span>GESTÃO</span><span>NUTRIÇÃO</span><span>SUSTENTABILIDADE</span><i class="accent"></i></div>
        <div class="future">Juntos por um futuro mais eficiente</div>
      </div>
    </div>`;

  const user=document.getElementById("loginUser");
  const pass=document.getElementById("loginPass");
  const toggle=document.getElementById("togglePassword");
  const eye=toggle?.querySelector(".icon-eye");
  const eyeOff=toggle?.querySelector(".icon-eye-off");

  toggle?.addEventListener("click",()=>{
    const show=pass.type==="password";
    pass.type=show?"text":"password";
    eye?.classList.toggle("hidden",show);
    eyeOff?.classList.toggle("hidden",!show);
    toggle.setAttribute("aria-label",show?"Ocultar senha":"Mostrar senha");
  });

  function normalizeIdentifier(){
    const original=user?.value||"";
    const trimmed=original.trim();
    if(!trimmed.includes("@")) return null;
    const username=trimmed.split("@")[0].trim();
    if(!username) return null;
    user.value=username;
    return original;
  }

  function restoreIdentifier(original){
    if(original===null) return;
    setTimeout(()=>{
      if(!auth.classList.contains("hidden")&&user) user.value=original;
    },0);
  }

  document.addEventListener("click",e=>{
    if(e.target.closest("#loginButton")){
      const original=normalizeIdentifier();
      restoreIdentifier(original);
    }
  },true);

  document.addEventListener("keydown",e=>{
    if(e.key!=="Enter") return;
    if(e.target===pass){
      const original=normalizeIdentifier();
      restoreIdentifier(original);
    }else if(e.target===user){
      e.preventDefault();
      const original=normalizeIdentifier();
      if(typeof window.login==="function") window.login();
      restoreIdentifier(original);
    }
  },true);
})();

if(!window.__sharedDishesLoader){
  window.__sharedDishesLoader=true;
  const link=document.createElement("link");
  link.rel="stylesheet";
  link.href="shared-dishes.css";
  document.head.appendChild(link);
  window.addEventListener("load",()=>{
    const script=document.createElement("script");
    script.src="shared-dishes.js";
    document.body.appendChild(script);
  });
}
