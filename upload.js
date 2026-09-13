const fs=require('fs');
const path=require('path');
const crypto=require('node:crypto');
const formidable=require('formidable');
const {put}=require('@vercel/blob');
const {requireAdmin}=require('../lib/auth');

module.exports.config={api:{bodyParser:false}};
const MAX_FILE_SIZE=10*1024*1024;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp','image/gif','image/avif']);

function extFromMime(mime){
  const map={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','image/avif':'.avif'};
  return map[mime]||'';
}

module.exports=async function(req,res){
  if(req.method!=='POST') return res.status(405).json({success:false,error:'Método não permitido.'});
  if(!requireAdmin(req,res)) return;
  if(!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({success:false,error:'BLOB_READ_WRITE_TOKEN não configurado.'});

  let uploaded;
  try{
    const form=formidable({multiples:false,maxFiles:1,maxFileSize:MAX_FILE_SIZE,keepExtensions:false});
    const [,files]=await form.parse(req);
    uploaded=Array.isArray(files.file)?files.file[0]:files.file;
    if(!uploaded?.filepath) return res.status(400).json({success:false,error:'Nenhuma imagem foi enviada.'});

    const mime=String(uploaded.mimetype||'').toLowerCase();
    if(!ALLOWED.has(mime)) return res.status(415).json({success:false,error:'Formato não permitido. Use JPG, PNG, WEBP, GIF ou AVIF.'});
    if(Number(uploaded.size)>MAX_FILE_SIZE) return res.status(413).json({success:false,error:'A imagem excede o limite de 10 MB.'});

    const buffer=fs.readFileSync(uploaded.filepath);
    if(!buffer.length) return res.status(400).json({success:false,error:'O arquivo enviado está vazio.'});

    const filename=`products/${Date.now()}-${crypto.randomUUID()}${extFromMime(mime)}`;
    const blob=await put(filename,buffer,{access:'public',token:process.env.BLOB_READ_WRITE_TOKEN,contentType:mime,addRandomSuffix:false});
    return res.status(200).json({success:true,ok:true,url:blob.url,pathname:blob.pathname,contentType:blob.contentType,size:buffer.length});
  }catch(error){
    console.error('upload',error);
    const message=error?.code==='LIMIT_FILE_SIZE'?'A imagem excede o limite de 10 MB.':'Não foi possível enviar a imagem.';
    return res.status(500).json({success:false,error:message});
  }finally{
    try{if(uploaded?.filepath&&fs.existsSync(uploaded.filepath))fs.unlinkSync(uploaded.filepath);}catch(e){console.warn('upload cleanup',e);}
  }
};
