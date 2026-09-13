module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).json({success:false,error:'Método não permitido.'});
  const clientId=process.env.GOOGLE_CLIENT_ID;
  if(!clientId) return res.status(500).json({success:false,error:'GOOGLE_CLIENT_ID não configurado no Vercel.'});
  return res.status(200).json({success:true,clientId});
};
