const token=new URLSearchParams(location.search).get("token");
const title=document.getElementById("verifyTitle"), msg=document.getElementById("verifyMessage"), btn=document.getElementById("loginButton");
btn.onclick=()=>location.href="/pages/auth/auth.html?mode=login";
(async()=>{if(!token){title.textContent="Invalid verification link";msg.textContent="The verification token is missing.";btn.classList.remove("hidden");return;}
try{const r=await fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw Error(d.detail||"Verification failed.");title.textContent="Email verified ✓";msg.textContent=d.message||"You can now log in.";btn.classList.remove("hidden");}
catch(e){title.textContent="Verification failed";msg.textContent=e.message;btn.classList.remove("hidden");}})();