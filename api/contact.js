import { createHash } from 'node:crypto';
const types=new Set(['Lakossági szerelés','Ipari kivitelezés','Árambővítés napelemhez','Érintésvédelmi felülvizsgálat','Egyéb villanyszerelési munka']);
const buckets=new Map();
const email=value=>typeof value==='string'&&value.length<=180&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function createHandler({env=process.env,send=fetch,now=Date.now}={}){return async(req,res)=>{
 const reply=(code,message,extra={})=>{res.setHeader('Cache-Control','no-store');res.status(code).json({message,...extra});};
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,'Nem támogatott kérés.');}
 const allowed=new Set((env.ALLOWED_ORIGINS||'').split(',').filter(Boolean));
 for(const key of ['VERCEL_URL','VERCEL_PROJECT_PRODUCTION_URL'])if(env[key])allowed.add('https://'+env[key]);
 if(!allowed.has(req.headers.origin))return reply(403,'Az oldal frissítése után próbálja újra.');
 if(!(req.headers['content-type']||'').startsWith('application/json'))return reply(415,'Érvénytelen formátum.');
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return reply(400,'Érvénytelen kérés.');}
 if(!body||typeof body!=='object'||Buffer.byteLength(JSON.stringify(body))>16000)return reply(400,'Túl nagy vagy érvénytelen kérés.');
 if(body.website)return reply(400,'Az üzenet nem küldhető el.');
 const text=(key,max)=>typeof body[key]==='string'&&body[key].trim().length>0&&body[key].length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(body[key]);
 if(!text('name',120)||!text('phone',40)||!text('city',120)||!text('description',5000)||!email(body.email)||!types.has(body.worktype)||!/^\+?[\d\s()/-]{6,40}$/.test(body.phone)||!/^[-\da-f]{36}$/i.test(body.requestId||''))return reply(400,'Kérem, ellenőrizze a megadott adatokat.');
 if(!env.BREVO_API_KEY||!email(env.BREVO_SENDER_EMAIL)||!email(env.CONTACT_TO_EMAIL))return reply(503,'Az online küldés még nem elérhető. Kérem, hívjon minket vagy írjon e-mailt.');
 const ip=req.headers['x-forwarded-for']?.split(',')[0]||'local';const hash=createHash('sha256').update(ip).digest('hex');const time=now();
 for(const [key,bucket]of buckets)if(time-bucket.start>600000)buckets.delete(key);
 const bucket=buckets.get(hash)||{start:time,count:0};if(bucket.count>=5)return reply(429,'Túl sok kérés. Kérem, később próbálja újra.');bucket.count++;buckets.set(hash,bucket);
 const textContent=[`Név: ${body.name}`,`Telefonszám: ${body.phone}`,`E-mail: ${body.email}`,`Település: ${body.city}`,`Munka típusa: ${body.worktype}`,'','Hiba vagy javítási igény:',body.description].join('\n');
 try{const response=await send('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({sender:{name:env.BREVO_SENDER_NAME||'Vill-Centrum Kft.',email:env.BREVO_SENDER_EMAIL},to:[{email:env.CONTACT_TO_EMAIL}],replyTo:{email:body.email,name:body.name.replace(/[\r\n]/g,' ')},subject:`Villanyszerelési ajánlatkérés – ${body.worktype}`,textContent,headers:{idempotencyKey:body.requestId}}),signal:AbortSignal.timeout(12000)});const result=await response.json().catch(()=>({}));if(response.ok&&result.messageId)return reply(200,'Az ajánlatkérést átadtuk a levelezőrendszernek.',{accepted:true});if(result.code==='duplicate_parameter')return reply(200,'Ezt az ajánlatkérést már átadtuk a levelezőrendszernek.',{accepted:true});return reply(502,'A küldés nem sikerült. Az adatai megmaradtak, próbálja újra vagy hívjon minket.');}catch{return reply(502,'A küldés eredménye nem ellenőrizhető. Újrapróbálhatja ugyanazt a kérést, vagy hívjon minket.');}
};}
export default createHandler();
