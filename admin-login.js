const {setSessionCookie}=require('../lib/auth');

const MAX_TOKEN_LENGTH=20000;

function normalizeEmail(value){
  return String(value||'').trim().toLowerCase();
}

module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({success:false,error:'Método não permitido.'});

  const clientId=process.env.GOOGLE_CLIENT_ID;
  const allowedEmail=normalizeEmail(process.env.ADMIN_GOOGLE_EMAIL);
  const sessionSecret=process.env.ADMIN_SESSION_SECRET;
  if(!clientId||!allowedEmail||!sessionSecret){
    return res.status(500).json({success:false,error:'Configuração do login Google incompleta no Vercel.'});
  }

  try{
    const credential=String(req.body?.credential||'').trim();
    if(!credential || credential.length>MAX_TOKEN_LENGTH){
      return res.status(401).json({success:false,error:'Credencial Google inválida.'});
    }

    const tokenInfoUrl=`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const googleResponse=await fetch(tokenInfoUrl,{headers:{Accept:'application/json'}});
    const info=await googleResponse.json().catch(()=>null);

    if(!googleResponse.ok || !info){
      return res.status(401).json({success:false,error:'Não foi possível validar a conta Google.'});
    }

    if(String(info.aud||'')!==clientId){
      return res.status(401).json({success:false,error:'Esta conta não está vinculada a este painel.'});
    }

    if(String(info.email_verified||'').toLowerCase()!=='true'){
      return res.status(401).json({success:false,error:'O Google não confirmou este endereço de e-mail.'});
    }

    const email=normalizeEmail(info.email);
    if(!email || email!==allowedEmail){
      return res.status(403).json({success:false,error:'Esta conta Google não tem permissão para acessar o painel.'});
    }

    const expiresAt=Number(info.exp||0)*1000;
    if(!expiresAt || expiresAt<=Date.now()){
      return res.status(401).json({success:false,error:'A credencial Google expirou. Faça login novamente.'});
    }

    setSessionCookie(res,email,req);
    return res.status(200).json({success:true,user:email});
  }catch(error){
    console.error('admin-login-google',error);
    return res.status(500).json({success:false,error:'Não foi possível processar o login com Google.'});
  }
};
