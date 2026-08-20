const token=new URLSearchParams(location.search).get("token");
const form=document.getElementById("resetForm"), msg=document.getElementById("resetMessage");
form.onsubmit=async e=>{e.preventDefault();if(!token){msg.textContent="Invalid or missing reset link.";msg.style.color="#ef4444";return;}
const p=document.getElementById("newPassword").value,c=document.getElementById("confirmPassword").value;
if(p.length<8){msg.textContent="Password must be at least 8 characters.";msg.style.color="#ef4444";return;}
if(p!==c){msg.textContent="Passwords do not match.";msg.style.color="#ef4444";return;}
try{const r=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,new_password:p})});const d=await r.json();if(!r.ok)throw Error(d.detail||"Unable to reset password.");msg.textContent=d.message||"Password updated successfully.";msg.style.color="#10b981";setTimeout(()=>location.href="/pages/auth/auth.html?mode=login",1200);}
catch(e){msg.textContent=e.message;msg.style.color="#ef4444";}};