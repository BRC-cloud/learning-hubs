const PASS_HASH='a797a2507cd8e2cd9f408f00cc8c94dd38e8b0f168ef1c75c1142d0daa40658c';
const TOKEN=PASS_HASH.slice(0,32);

export async function onRequest(context){
  const cookie=context.request.headers.get('Cookie')||'';
  if(cookie.includes('_hub_auth='+TOKEN)){
    const resp=await context.next();
    const nr=new Response(resp.body,resp);
    nr.headers.set('Cache-Control','no-cache, no-store, must-revalidate');
    nr.headers.set('Pragma','no-cache');
    return nr;
  }
  if(context.request.method==='POST'){
    const form=await context.request.formData();
    const pass=form.get('pass')||'';
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pass));
    const hash=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(hash===PASS_HASH){
      return new Response(null,{status:302,headers:{'Location':new URL(context.request.url).pathname,'Set-Cookie':'_hub_auth='+TOKEN+'; Path=/; Max-Age=2592000; SameSite=Strict; Secure; HttpOnly'}});
    }
    return loginPage('Mot de passe incorrect');
  }
  return loginPage('');
}

function loginPage(err){
  return new Response(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connexion</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',system-ui,sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.c{background:#1e293b;border-radius:20px;padding:36px;max-width:360px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.3);text-align:center}h1{font-size:22px;color:#e2e8f0;margin-bottom:6px}p{font-size:14px;color:#94a3b8;margin-bottom:24px}input{width:100%;padding:14px;border:2px solid #334155;border-radius:12px;font-size:16px;outline:none;background:#0f172a;color:#e2e8f0;margin-bottom:14px;box-sizing:border-box}input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.2)}button{width:100%;padding:14px;background:#2563eb;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s}button:hover{background:#1e3a5f;transform:translateY(-1px)}.err{color:#f87171;font-size:14px;margin-bottom:12px}</style></head><body><div class="c"><h1>🎓 Mes Hubs</h1><p>Espace personnel de formation</p>${err?'<p class="err">'+err+'</p>':''}<form method="POST"><input type="password" name="pass" placeholder="Mot de passe" autofocus required><button type="submit">Entrer</button></form></div></body></html>`,{status:401,headers:{'Content-Type':'text/html;charset=UTF-8'}});
}
