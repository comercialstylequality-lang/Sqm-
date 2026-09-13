import fs from 'node:fs';
import path from 'node:path';
import auth from '../lib/auth.js';
const { requireAdmin }=auth;
import redisLib from '../lib/redis.js';
const { getJson, setJson, del }=redisLib;
const KEY='sqm:editor:html';
const MAX_HTML=700*1024;
export default async function(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(!requireAdmin(req,res)) return;
    if(req.method==='GET'){
      const html=await getJson(KEY);
      return res.status(200).json({ok:true,html:html||''});
    }
    if(req.method==='PUT'){
      const html=String(req.body?.html||'');
      if(!html.trim()) return res.status(400).json({ok:false,error:'HTML vazio.'});
      if(Buffer.byteLength(html,'utf8')>MAX_HTML) return res.status(413).json({ok:false,error:'HTML muito grande.'});
      if(!/^<!doctype html|<html[\s>]/i.test(html.trim())) return res.status(400).json({ok:false,error:'O editor precisa conter um documento HTML completo.'});
      await setJson(KEY,html);
      return res.status(200).json({ok:true,published:true});
    }
    if(req.method==='DELETE'){
      await del(KEY);
      const original=fs.readFileSync(path.join(process.cwd(),'store-original.html'),'utf8');
      return res.status(200).json({ok:true,published:true,html:original});
    }
    return res.status(405).json({ok:false,error:'Método não permitido.'});
  }catch(e){console.error('SQM editor:',e);return res.status(500).json({ok:false,error:e.message||'Erro no editor.'});}
};
