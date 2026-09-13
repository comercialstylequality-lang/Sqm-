import { put } from '@vercel/blob';
import formidablePkg from 'formidable';
const { formidable } = formidablePkg;
import fs from 'node:fs';
import auth from '../lib/auth.js';
const {requireAdmin}=auth;
export const config={api:{bodyParser:false}};
export default async function(req,res){
  if(req.method!=='POST') return res.status(405).json({success:false,error:'Método não permitido.'});
  if(!requireAdmin(req,res)) return;
  try{
    if(!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({success:false,error:'BLOB_READ_WRITE_TOKEN não configurado.'});
    const form=formidable({multiples:false,maxFileSize:8*1024*1024,keepExtensions:true});
    const [,files]=await form.parse(req);
    const raw=files.file; const file=Array.isArray(raw)?raw[0]:raw;
    if(!file) return res.status(400).json({success:false,error:'Arquivo não enviado.'});
    if(!String(file.mimetype||'').startsWith('image/')) return res.status(400).json({success:false,error:'Somente imagens são permitidas.'});
    const buffer=fs.readFileSync(file.filepath);
    const safe=String(file.originalFilename||'imagem').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
    const blob=await put(`products/${Date.now()}-${safe}`,buffer,{access:'public',addRandomSuffix:true,contentType:file.mimetype,cacheControlMaxAge:86400});
    try{fs.unlinkSync(file.filepath);}catch{}
    return res.status(200).json({success:true,url:blob.url,pathname:blob.pathname});
  }catch(e){console.error(e);return res.status(500).json({success:false,error:e.message||'Falha no upload.'});}
};
