(function(){
  "use strict";

  const user=document.getElementById("loginUser");
  const pass=document.getElementById("loginPass");
  const toggle=document.getElementById("togglePassword");

  if(toggle&&pass){
    const eye=toggle.querySelector(".icon-eye");
    const eyeOff=toggle.querySelector(".icon-eye-off");
    toggle.addEventListener("click",()=>{
      const show=pass.type==="password";
      pass.type=show?"text":"password";
      eye?.classList.toggle("hidden",show);
      eyeOff?.classList.toggle("hidden",!show);
      toggle.setAttribute("aria-label",show?"Ocultar senha":"Mostrar senha");
    });
  }

  function normalizeIdentifier(){
    if(!user) return null;
    const original=user.value;
    const trimmed=original.trim();
    if(!trimmed.includes("@")) return null;
    const username=trimmed.split("@")[0].trim();
    if(!username) return null;
    user.value=username;
    return original;
  }

  function restoreIdentifier(original){
    if(original===null||!user) return;
    setTimeout(()=>{
      const auth=document.getElementById("authScreen");
      if(auth&&!auth.classList.contains("hidden")) user.value=original;
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