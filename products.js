const {requireAdmin}=require('../lib/auth');
const {getJson,setJson}=require('../lib/redis');
const INITIAL_PRODUCTS=[
{id:1,name:'Camiseta Básica Tech Insider',cost:166.25,price:166.25,category:'clothing',newArrival:true,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-3193860320-camiseta-basica-tech-insider-masculina-_JM'},
{id:2,name:'Camiseta Manga Longa Básica 100% Algodão',cost:31.15,price:31.15,category:'clothing',newArrival:false,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-4211231565-camiseta-manga-longa-masculina-basica-100-algodao-camisa-_JM'},
{id:3,name:'Kit 6 Camisetas Básicas Masculinas',cost:138.13,price:138.13,category:'clothing',newArrival:false,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-2775895319-6-camiseta-basica-masculina-camisa-lisa-cores-algodao-_JM'},
{id:4,name:'Camiseta Básica Lisa 100% Algodão Premium',cost:43.65,price:43.65,category:'clothing',newArrival:true,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-3673537813-camiseta-masculina-basica-lisa-100-algodao-premium-_JM'},
{id:5,name:'Camiseta Básica Tech Modal Anti-Odor',cost:45,price:45,category:'clothing',newArrival:true,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-5167782652-camiseta-masculina-anti-odor-tech-modal-basica-no-amassa-_JM'},
{id:6,name:'Camiseta Básica Canelada Tricot Modal',cost:69.9,price:69.9,category:'clothing',newArrival:false,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-4421548667-camiseta-masculina-basica-canelada-manga-curta-tricot-modal-_JM'},
{id:7,name:'Camiseta Básica Algodão Brasil 2026',cost:36.9,price:36.9,category:'clothing',newArrival:true,featured:false,active:true,stock:0,image:'',description:'',sizes:[],colors:[],supplier:'https://produto.mercadolivre.com.br/MLB-6241967020-camiseta-masculina-basica-algodao-brasil-copa-do-mundo-2026-_JM'}
];
function safeUrl(value){
  const s=String(value||'').trim();
  if(!s)return '';
  try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?s:'';}catch{return '';}
}
function cleanProducts(list){
  if(!Array.isArray(list)) throw new Error('Lista de produtos inválida.');
  if(list.length>500) throw new Error('Limite de 500 produtos excedido.');
  return list.map((p,i)=>{
    const price=Number(p.price),cost=Number(p.cost),stock=Number(p.stock);
    return {
      id:p.id??Date.now()+i,name:String(p.name||'').trim().slice(0,180),cost:Number.isFinite(cost)?Math.max(0,cost):0,price:Number.isFinite(price)?Math.max(0,price):0,
      category:p.category==='fragrance'?'fragrance':'clothing',newArrival:!!p.newArrival,featured:!!p.featured,active:p.active!==false,
      stock:Number.isFinite(stock)?Math.max(0,Math.floor(stock)):0,image:safeUrl(p.image),images:Array.isArray(p.images)?p.images.map(safeUrl).filter(Boolean).slice(0,20):[],
      description:String(p.description||'').slice(0,4000),sizes:Array.isArray(p.sizes)?p.sizes.map(x=>String(x).trim().slice(0,50)).filter(Boolean).slice(0,20):[],
      colors:Array.isArray(p.colors)?p.colors.map(x=>String(x).trim().slice(0,80)).filter(Boolean).slice(0,20):[],supplier:safeUrl(p.supplier)
    };
  }).filter(p=>p.name && p.price>=0 && p.cost>=0);
}

module.exports=async function(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){
      const products=await getJson('sqm:products');
      return res.status(200).json({exists:true,products:products||INITIAL_PRODUCTS});
    }
    if(req.method==='PUT'){
      if(!requireAdmin(req,res)) return;
      const products=cleanProducts(req.body?.products);
      await setJson('sqm:products',products);
      return res.status(200).json({ok:true,products});
    }
    return res.status(405).json({error:'Método não permitido.'});
  }catch(e){console.error(e);return res.status(500).json({error:e.message||'Erro no catálogo.'});}
};
module.exports.INITIAL_PRODUCTS=INITIAL_PRODUCTS;
