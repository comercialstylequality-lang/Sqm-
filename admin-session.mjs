import auth from '../lib/auth.js';
const {verifySession}=auth;
export default async function(req,res){
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Vary','Cookie');
  if(req.method!=='GET') return res.status(405).json({success:false,error:'Método não permitido.'});
  const s=verifySession(req);
  return res.status(200).json({authenticated:!!s,user:s?.u||null});
};
