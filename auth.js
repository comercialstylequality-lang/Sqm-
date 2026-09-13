const crypto = require('crypto');

const COOKIE = 'sqm_admin_session';
const MAX_AGE = 60 * 60 * 12;

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function secret() {
  if (!process.env.ADMIN_SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET não configurada.');
  return process.env.ADMIN_SESSION_SECRET;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

function timingSafeEqual(a,b){
  const aa=Buffer.from(a), bb=Buffer.from(b);
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}

function parseCookies(header='') {
  const out={};
  for(const part of String(header||'').split(';')){
    const i=part.indexOf('='); if(i<0) continue;
    const key=part.slice(0,i).trim();
    let value=part.slice(i+1).trim();
    if(value.startsWith('\"') && value.endsWith('\"')) value=value.slice(1,-1);
    try{value=decodeURIComponent(value)}catch{}
    if(key) out[key]=value;
  }
  return out;
}

function createSession(user){
  const payload=JSON.stringify({u:user,t:Date.now()});
  const encoded=b64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

function verifySession(req){
  const token=parseCookies(req.headers.cookie||'')[COOKIE];
  if(!token) return null;
  const [encoded,sig]=token.split('.');
  if(!encoded||!sig) return null;
  if(!timingSafeEqual(sig,sign(encoded))) return null;
  try{
    const data=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
    if(!data?.u || !data?.t || Date.now()-Number(data.t)>MAX_AGE*1000) return null;
    return data;
  }catch{return null;}
}

function setSessionCookie(res,user,req){
  const token=createSession(user);
  const proto=String(req?.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
  const secure=proto==='https' ? '; Secure' : '';
  res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${MAX_AGE}; Priority=High`);
}
function clearSessionCookie(res,req){
  const proto=String(req?.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
  const secure=proto==='https' ? '; Secure' : '';
  res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0; Priority=High`);
}
function requireAdmin(req,res){
  const session=verifySession(req);
  if(!session){res.status(401).json({success:false,error:'Não autenticado.'});return null;}
  return session;
}

module.exports={COOKIE,MAX_AGE,setSessionCookie,clearSessionCookie,verifySession,requireAdmin};
