const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,x-teacher-key','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const url = Deno.env.get('SUPABASE_URL')!;
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers = {apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
function reply(data: unknown,status=200){return new Response(JSON.stringify(data),{status,headers:cors});}
async function hash(text:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function db(path:string,body?:unknown){
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch(`${url}/rest/v1/${path}`,{headers,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
   if(r.ok)return r.json();
   const detail=await r.json().catch(()=>({}));console.error('Database request failed',r.status,detail.code||'unknown');
   if(r.status<500&&r.status!==429)throw new Error('database-validation');
  }catch(e){if(e instanceof Error&&e.message==='database-validation')throw e;}
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,500+Math.random()*1500));
 }
 throw new Error('database');
}
async function teacher(req:Request){
 const key=req.headers.get('x-teacher-key')||'';if(key.length<40||key.length>120)return false;
 const rows=await db('assembly_config?select=teacher_hash&id=eq.true');return rows[0]?.teacher_hash===await hash(key);
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply({ok:false,error:'無效操作。'},405);
 try{
  const route=new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if(route==='stats'){
   if(!await teacher(req))return reply({ok:false,error:'私人後台需要有效的老師存取碼。'},401);
   const body=await req.json();
   const rows=[];
   const test=body.test===true||new URL(req.url).pathname.includes('/qa/');
   for(let offset=0;offset<10000;offset+=1000){
    const page=await db(`assembly_responses?test=eq.${test}&select=id,grade,class,number,answers,survey,score,submitted_at&order=grade.asc,class.asc,number.asc&limit=1000&offset=${offset}`);
    rows.push(...page);if(page.length<1000)break;
   }
   return reply({ok:true,data:{rows,generated_at:new Date().toISOString()}});
  }
  if(route!=='submit'&&route!=='qa-submit')return reply({ok:false,error:'無效操作。'},404);
  const test=route==='qa-submit';if(test&&!await teacher(req))return reply({ok:false,error:'未獲授權。'},401);
  const text=await req.text();if(text.length>12000)return reply({ok:false,error:'資料過長。'},413);
  const body=JSON.parse(text), {token,identity,answers,survey}=body;
  if(typeof token!=='string'||!/^[-a-zA-Z0-9]{64,100}$/.test(token))return reply({ok:false,error:'請重新載入作答頁面。'},400);
  if(!identity||!Number.isInteger(identity.grade)||identity.grade<1||identity.grade>6||!['A','B','C','D'].includes(identity.class)||!Number.isInteger(identity.number)||identity.number<1||identity.number>99)return reply({ok:false,error:'請選擇有效的級別、班別及學號。'},400);
  const sizes=[4,4,4,4,5,4,4];
  if(!Array.isArray(answers)||answers.length!==7||!answers.every((a:any,i:number)=>Array.isArray(a)&&a.length>0&&(i===4?a.length<=5:a.length===1)&&new Set(a).size===a.length&&a.every((v:any)=>Number.isInteger(v)&&v>=0&&v<sizes[i])))return reply({ok:false,error:'請先完成全部七題。'},400);
  if(!Array.isArray(survey)||survey.length!==4||!survey.every((v:any)=>Number.isInteger(v)&&v>=0&&v<4))return reply({ok:false,error:'請先完成全部四項問卷。'},400);
  const sorted=answers.map((a:number[])=>[...a].sort((a,b)=>a-b));
  const data=await db('rpc/assembly_submit',{p_token:await hash(token),p_grade:identity.grade,p_class:identity.class,p_number:identity.number,p_answers:sorted,p_survey:survey,p_test:test});
  return reply(data,data.ok?200:409);
 }catch(e){
  if(e instanceof SyntaxError)return reply({ok:false,error:'無效資料。'},400);
  console.error('Assembly service unavailable');return reply({ok:false,error:'連線暫時繁忙，答案已保留，請稍後重新提交。'},503);
 }
});
