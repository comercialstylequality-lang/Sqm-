import auth from '../lib/auth.js';
const {clearSessionCookie}=auth;
export default async function(req,res){
  if(req.method!=='POST') return res.status(405).json({success:false,error:'Método não permitido.'});
  clearSessionCookie(res,req);
  return res.status(200).json({success:true});
};
