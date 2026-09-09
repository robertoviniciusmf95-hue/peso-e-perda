(function(){
"use strict";
if(window.__closingConfirmationReady) return;
window.__closingConfirmationReady=true;

const EPS=0.0005;

function n(v){const x=Number(v);return Number.isFinite(x)?x:0}
function sameText(a,b){return String(a||"").trim().toLocaleLowerCase("pt-BR")===String(b||"").trim().toLocaleLowerCase("pt-BR")}
function initialTrayDisplay(d){
  if(d?.trayName==="__manual__") return "Travessa manual do início";
  return String(d?.trayName||"").trim()||"Não informada";
}
function ensureClosingFields(name){
  if(typeof window.ensureItemOn==="function") window.ensureItemOn(name);
  const d=state.items[name];
  d.finalTrayName=String(d.finalTrayName||"");
  d.finalTrayWeight=n(d.finalTrayWeight);
  d.finalTrayValidated=d.finalTrayValidated===true;
  d.trayChanged=d.trayChanged===true;
  d.closingInitialTrayName=String(d.closingInitialTrayName||"");
  d.closingInitialTrayWeight=n(d.closingInitialTrayWeight);

  if(d.finalTrayValidated){
    const snapName=d.closingInitialTrayName;
    const snapWeight=d.closingInitialTrayWeight;
    const currentName=initialTrayDisplay(d);
    const currentWeight=n(d.trayWeight);
    if(!sameText(snapName,currentName)||Math.abs(snapWeight-currentWeight)>EPS){
      d.finalTrayName="";
      d.finalTrayWeight=0;
      d.finalTrayValidated=false;
      d.trayChanged=false;
      d.closingInitialTrayName="";
      d.closingInitialTrayWeight=0;
    }
  }
  return d;
}

function closingFinalTare(d){
  if(d?.finalTrayValidated) return n(d.finalTrayWeight);
  return n(d?.trayWeight);
}

window.finalNet=function(name){
  const d=state?.items?.[name];
  if(!d) return 0;
  return Math.max(0,n(d.finalGross)-closingFinalTare(d));
};

function closingIsValidated(name){
  const d=ensureClosingFields(name);
  return !!d.trayName && n(d.trayWeight)>0 && !!d.finalTrayName && n(d.finalTrayWeight)>0 && d.finalTrayValidated===true;
}

function allClosingValidated(){
  const names=typeof window.orderedSelected==="function"?window.orderedSelected():[];
  return names.length>0 && names.every(closingIsValidated);
}

function statusFor(d){
  if(!d.trayName||n(d.trayWeight)<=0) return {cls:"missing",text:"Travessa inicial não informada"};
  if(!d.finalTrayName||!d.finalTrayValidated) return {cls:"pending",text:"Informe a travessa do fechamento"};
  if(d.trayChanged) return {cls:"changed",text:"Troca de travessa confirmada"};
  return {cls:"confirmed",text:"Travessa confirmada"};
}

function optionValue(label,weight,source){
  return encodeURIComponent(JSON.stringify({label,weight:n(weight),source}));
}
function parseOption(v){
  try{return JSON.parse(decodeURIComponent(v))}catch(_){return null}
}

function finalTrayOptions(d){
  const options=['<option value="">Selecionar travessa utilizada</option>'];
  const initialName=initialTrayDisplay(d);
  const initialWeight=n(d.trayWeight);
  if(d.trayName==="__manual__"&&initialWeight>0){
    const val=optionValue(initialName,initialWeight,"initial-manual");
    const selected=d.finalTrayValidated&&sameText(d.finalTrayName,initialName)&&Math.abs(n(d.finalTrayWeight)-initialWeight)<=EPS?" selected":"";
    options.push(`<option value="${val}"${selected}>${esc(initialName)} — ${initialWeight.toFixed(3)} kg</option>`);
  }
  const presets=typeof window.allTrayPresets==="function"?window.allTrayPresets():[];
  presets.forEach(t=>{
    const label=String(t.name||"");
    const weight=n(t.weight);
    const val=optionValue(label,weight,"preset");
    const selected=d.finalTrayValidated&&sameText(d.finalTrayName,label)&&Math.abs(n(d.finalTrayWeight)-weight)<=EPS?" selected":"";
    options.push(`<option value="${val}"${selected}>${esc(label)} — ${weight.toFixed(3)} kg</option>`);
  });
  return options.join("");
}

function updateFinishState(){
  const btn=document.getElementById("finishBtn");
  if(!btn) return;
  const names=typeof window.orderedSelected==="function"?window.orderedSelected():[];
  const valid=names.filter(closingIsValidated).length;
  btn.dataset.validated=`${valid}/${names.length}`;
  btn.title=valid===names.length?"Todas as travessas foram validadas":`${valid}/${names.length} travessas validadas`;
}

window.renderClosing=function(){
  const root=document.getElementById("closingList");
  if(!root) return;
  const names=typeof window.orderedSelected==="function"?window.orderedSelected():[];
  let validCount=0;
  let html='<div class="closing-confirm-summary"><div><b>Conferência das travessas</b><span>Confirme a travessa usada no peso final antes de concluir o buffet.</span></div><div id="closingValidatedCount" class="closing-validated-count"></div></div><div class="closing-confirm-list">';

  names.forEach(name=>{
    const d=ensureClosingFields(name);
    const valid=closingIsValidated(name);
    if(valid) validCount++;
    const st=statusFor(d);
    const initialName=initialTrayDisplay(d);
    const initialWeight=n(d.trayWeight);
    const finalName=d.finalTrayName||"Não informada";
    const finalWeight=n(d.finalTrayWeight);
    const finalGross=n(d.finalGross);
    const finalLiquid=valid?Math.max(0,finalGross-finalWeight):null;
    const alertHtml=(!d.trayName||initialWeight<=0)
      ? '<div class="closing-alert error">Atenção: volte à etapa Pesos e informe a travessa utilizada no peso inicial.</div>'
      : d.finalTrayValidated&&d.trayChanged
        ? '<div class="closing-alert warning">Atenção: a travessa selecionada é diferente da utilizada no início. A troca foi confirmada e a tara final será usada no cálculo.</div>'
        : d.finalTrayValidated
          ? '<div class="closing-alert ok">Travessa confirmada. A tara do fechamento está validada para o cálculo.</div>'
          : '<div class="closing-alert neutral">Selecione a travessa que está sendo pesada no fechamento para validar a tara.</div>';

    html+=`<div class="closing-confirm-card ${st.cls}" data-closing-card="${esc(name)}">
      <div class="closing-confirm-head">
        <div><b>${esc(name)}</b><span>Inicial líquido: ${initialNet(name).toFixed(3)} kg • Reposições: ${repoTotal(name).toFixed(3)} kg</span></div>
        <span class="closing-status ${st.cls}">${esc(st.text)}</span>
      </div>
      <div class="closing-confirm-grid">
        <div class="closing-info-box">
          <label>Travessa inicial</label>
          <strong>${esc(initialName)}</strong>
          <span>Tara inicial: ${initialWeight.toFixed(3)} kg</span>
        </div>
        <div class="closing-info-box closing-final-tray">
          <label for="finalTray_${safeId(name)}">Travessa utilizada</label>
          <select id="finalTray_${safeId(name)}" ${(!d.trayName||initialWeight<=0)?"disabled":""}>${finalTrayOptions(d)}</select>
          <span>Selecionada: ${esc(finalName)}${d.finalTrayValidated?` • Tara: ${finalWeight.toFixed(3)} kg`:""}</span>
        </div>
        <div class="closing-info-box">
          <label for="final_${safeId(name)}">Final com travessa</label>
          <input id="final_${safeId(name)}" type="number" step="0.001" min="0" inputmode="decimal" value="${d.finalGross||""}" placeholder="0,000">
          <span>Peso bruto do fechamento</span>
        </div>
        <div class="closing-info-box closing-liquid-box ${valid?"ready":"waiting"}">
          <label>Sobra líquida</label>
          <strong id="closingNet_${safeId(name)}">${valid?finalLiquid.toFixed(3)+" kg":"Aguardando travessa"}</strong>
          <span>${valid?`Tara usada: ${finalWeight.toFixed(3)} kg`:"Valide a travessa para calcular"}</span>
        </div>
      </div>
      ${alertHtml}
    </div>`;
  });
  html+='</div>';
  root.innerHTML=html;
  const counter=document.getElementById("closingValidatedCount");
  if(counter) counter.innerHTML=`<b>${validCount}/${names.length}</b><span>travessas validadas</span>`;

  names.forEach(name=>{
    const traySel=document.getElementById("finalTray_"+safeId(name));
    const finalInput=document.getElementById("final_"+safeId(name));
    traySel?.addEventListener("change",e=>handleClosingTrayChange(name,e.target.value));
    finalInput?.addEventListener("input",e=>{
      const d=ensureClosingFields(name);
      d.finalGross=n(e.target.value);
      if(typeof window.saveDay==="function") window.saveDay();
      const net=document.getElementById("closingNet_"+safeId(name));
      if(net&&d.finalTrayValidated) net.textContent=Math.max(0,d.finalGross-n(d.finalTrayWeight)).toFixed(3)+" kg";
    });
  });
  if(typeof window.saveDay==="function") window.saveDay();
  updateFinishState();
};

function handleClosingTrayChange(name,rawValue){
  const d=ensureClosingFields(name);
  if(!rawValue){
    d.finalTrayName="";
    d.finalTrayWeight=0;
    d.finalTrayValidated=false;
    d.trayChanged=false;
    d.closingInitialTrayName="";
    d.closingInitialTrayWeight=0;
    saveDay();
    renderClosing();
    return;
  }
  const selected=parseOption(rawValue);
  if(!selected) return;
  const initialName=initialTrayDisplay(d);
  const initialWeight=n(d.trayWeight);
  const same=sameText(initialName,selected.label)&&Math.abs(initialWeight-n(selected.weight))<=EPS;

  if(!same){
    const ok=confirm("Você está utilizando uma travessa diferente da inicial. Deseja continuar com esta travessa?");
    if(!ok){
      d.finalTrayName="";
      d.finalTrayWeight=0;
      d.finalTrayValidated=false;
      d.trayChanged=false;
      d.closingInitialTrayName="";
      d.closingInitialTrayWeight=0;
      saveDay();
      renderClosing();
      return;
    }
  }

  d.closingInitialTrayName=initialName;
  d.closingInitialTrayWeight=initialWeight;
  d.finalTrayName=String(selected.label||"");
  d.finalTrayWeight=n(selected.weight);
  d.finalTrayValidated=true;
  d.trayChanged=!same;
  saveDay();
  renderClosing();
}

function validateAndFinish(){
  const names=typeof window.orderedSelected==="function"?window.orderedSelected():[];
  if(!names.length){alert("Não há pratos selecionados para fechar.");return}
  const missingInitial=names.filter(name=>{const d=ensureClosingFields(name);return !d.trayName||n(d.trayWeight)<=0});
  if(missingInitial.length){
    alert(`Não é possível finalizar. Informe a travessa inicial de ${missingInitial.length} prato(s) na etapa Pesos.`);
    go(2);
    return;
  }
  const pending=names.filter(name=>!closingIsValidated(name));
  if(pending.length){
    alert(`Confirme a travessa utilizada no fechamento de todos os pratos. Faltam ${pending.length} prato(s).`);
    renderClosing();
    return;
  }
  saveDay();
  go(5);
}

function protectFinishButton(){
  const old=document.getElementById("finishBtn");
  if(!old||old.dataset.closingProtected==="1") return;
  const btn=old.cloneNode(true);
  btn.dataset.closingProtected="1";
  old.replaceWith(btn);
  btn.addEventListener("click",validateAndFinish);
  updateFinishState();
}

const originalRenderSummary=window.renderSummary;
window.renderSummary=function(){
  if(!allClosingValidated()){
    const root=document.getElementById("summaryView");
    if(root) root.innerHTML='<div class="closing-summary-block"><b>Fechamento ainda não validado.</b><span>Confirme a travessa utilizada no peso final de todos os pratos antes de visualizar os cálculos do resumo.</span><button class="btn primary" type="button" onclick="go(4)">Voltar ao fechamento</button></div>';
    return;
  }
  return originalRenderSummary();
};

function normalizeHistoryItem(raw){
  const d=raw||{};
  const reposRaw=Array.isArray(d.repos)?d.repos:(Array.isArray(d.repositions)?d.repositions:[]);
  const initialName=String(d.closingInitialTrayName||d.trayName||"");
  const initialWeight=n(d.closingInitialTrayWeight||d.trayWeight);
  const hasNewClosing=Object.prototype.hasOwnProperty.call(d,"finalTrayValidated")||Object.prototype.hasOwnProperty.call(d,"finalTrayName")||Object.prototype.hasOwnProperty.call(d,"finalTrayWeight");
  const finalName=String(d.finalTrayName||(hasNewClosing?"":initialName));
  const finalWeight=n(d.finalTrayWeight||(hasNewClosing?0:initialWeight));
  const validated=hasNewClosing?d.finalTrayValidated===true:true;
  return{
    gross:n(d.gross??d.initialGross??d.initial),
    trayWeight:n(d.trayWeight),
    trayName:String(d.trayName||""),
    initialTrayName:initialName,
    initialTrayWeight:initialWeight,
    repos:reposRaw.map((r,idx)=>typeof r==="number"?{weight:n(r),time:"",seq:idx+1}:{weight:n(r?.weight??r?.value),time:String(r?.time||""),seq:n(r?.seq)||idx+1}),
    finalGross:n(d.finalGross??d.leftover),
    finalTrayName:finalName,
    finalTrayWeight:finalWeight,
    finalTrayValidated:validated,
    trayChanged:d.trayChanged===true
  };
}
window.historyNormalizeItem=normalizeHistoryItem;

window.historyMetrics=function(day){
  const names=historySelected(day),rows=[],reposEvents=[];
  let initial=0,repos=0,available=0,loss=0,consumed=0,repoCount=0;
  names.forEach(name=>{
    const d=normalizeHistoryItem(day?.items?.[name]||{});
    const initialNet=Math.max(0,d.gross-d.trayWeight);
    const repoTotalValue=d.repos.reduce((a,r)=>a+n(r.weight),0);
    const total=initialNet+repoTotalValue;
    const finalTare=d.finalTrayValidated&&d.finalTrayWeight>0?d.finalTrayWeight:d.trayWeight;
    const finalNetValue=Math.max(0,d.finalGross-finalTare);
    const consumption=Math.max(0,total-finalNetValue);
    const lossPct=total?finalNetValue/total:0;
    initial+=initialNet;repos+=repoTotalValue;available+=total;loss+=finalNetValue;consumed+=consumption;repoCount+=d.repos.length;
    rows.push({name,gross:d.gross,trayWeight:d.trayWeight,trayName:d.trayName,initialTrayName:d.initialTrayName,initialTrayWeight:d.initialTrayWeight,initialNet,repos:repoTotalValue,total,finalGross:d.finalGross,finalTrayName:d.finalTrayName||d.initialTrayName,finalTrayWeight:finalTare,finalTrayValidated:d.finalTrayValidated,trayChanged:d.trayChanged,finalNet:finalNetValue,consumption,lossPct});
    d.repos.forEach((r,idx)=>reposEvents.push({dish:name,weight:n(r.weight),time:r.time||"",seq:n(r.seq)||idx+1}));
  });
  reposEvents.sort((a,b)=>a.seq-b.seq);
  return{names,rows,reposEvents,initial,repos,available,loss,consumed,lossPct:available?loss/available:0,repoCount};
};

window.renderHistoryDate=function(dateStr){
  const root=document.getElementById("historyResult");
  if(!root) return;
  const day=historyLoadDay(dateStr);
  if(!day){
    root.innerHTML=`<div class="history-empty">Não existe resultado salvo para <b>${historyFormatDate(dateStr)}</b> neste dispositivo.</div>`;
    return;
  }
  const m=window.historyMetrics(day);
  const dishRows=m.rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${r.initialNet.toFixed(3)} kg</td><td><b>${esc(r.initialTrayName||"-")}</b><br><span class="repo-meta">${r.initialTrayWeight.toFixed(3)} kg</span></td><td>${r.repos.toFixed(3)} kg</td><td><b>${esc(r.finalTrayName||"-")}</b><br><span class="repo-meta">${r.finalTrayWeight.toFixed(3)} kg</span></td><td>${r.finalGross.toFixed(3)} kg</td><td>${r.finalNet.toFixed(3)} kg</td><td>${r.consumption.toFixed(3)} kg</td><td>${r.trayChanged?'<span class="history-tray-changed">Sim</span>':'<span class="history-tray-same">Não</span>'}</td></tr>`).join("");
  const repoRows=m.reposEvents.length?m.reposEvents.map(r=>`<tr><td>${esc(r.dish)}</td><td>${r.weight.toFixed(3)} kg</td><td>${esc(r.time||"-")}</td></tr>`).join(""):'<tr><td colspan="3">Nenhuma reposição registrada neste dia.</td></tr>';
  root.innerHTML=`<div class="history-day-card"><div class="history-day-head"><div><h2>Resultado do dia</h2><div class="history-day-date">${historyFormatDate(dateStr)} • ${m.rows.length} prato(s)</div></div><button class="btn history-export-btn" onclick="downloadHistoryExcel('${dateStr}')">Baixar Excel (.xlsx)</button></div><div class="history-kpis"><div class="history-kpi"><span>Peso inicial líquido</span><b>${m.initial.toFixed(3)} kg</b></div><div class="history-kpi"><span>Reposições</span><b>${m.repos.toFixed(3)} kg</b></div><div class="history-kpi"><span>Total disponibilizado</span><b>${m.available.toFixed(3)} kg</b></div><div class="history-kpi loss"><span>Perda / sobra</span><b>${m.loss.toFixed(3)} kg</b></div><div class="history-kpi good"><span>Consumo estimado</span><b>${m.consumed.toFixed(3)} kg</b></div><div class="history-kpi loss"><span>Índice de perda</span><b>${(m.lossPct*100).toFixed(1)}%</b></div><div class="history-kpi"><span>Pratos</span><b>${m.rows.length}</b></div><div class="history-kpi"><span>Nº reposições</span><b>${m.repoCount}</b></div></div><div class="history-table-area"><h3>Resultado por prato e conferência de travessas</h3><div class="tablewrap"><table><thead><tr><th>Prato</th><th>Inicial líquido</th><th>Travessa inicial</th><th>Reposições</th><th>Travessa fechamento</th><th>Final bruto</th><th>Sobra líquida</th><th>Consumo</th><th>Troca?</th></tr></thead><tbody>${dishRows}</tbody></table></div><div class="history-repos"><h3>Reposições do dia</h3><div class="tablewrap"><table><thead><tr><th>Prato</th><th>Peso</th><th>Horário</th></tr></thead><tbody>${repoRows}</tbody></table></div></div></div></div>`;
};

protectFinishButton();
if(document.getElementById("step4")&&!document.getElementById("step4").classList.contains("hidden")) renderClosing();
})();
