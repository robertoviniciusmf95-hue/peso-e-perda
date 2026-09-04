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
