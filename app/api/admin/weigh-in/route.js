import { NextResponse } from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request){
 try{
  const bearer=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
  const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!bearer||!base||!pub||!secret)return NextResponse.json({error:"Not authorized"},{status:403});
  const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+bearer},cache:"no-store"});
  if(!userRes.ok)return NextResponse.json({error:"Not authorized"},{status:403});
  const user=await userRes.json();
  if(!user.id)return NextResponse.json({error:"Not authorized"},{status:403});
  const headers={apikey:secret};
  const adminRes=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers,cache:"no-store"});
  if(!adminRes.ok||!(await adminRes.json()).length)return NextResponse.json({error:"Not authorized"},{status:403});
  async function read(path){
   const res=await fetch(base+"/rest/v1/"+path,{headers,cache:"no-store"});
   if(!res.ok){const detail=await res.text();console.error("Weigh In Supabase read failed",{table:path.split("?")[0],status:res.status,detail:detail.slice(0,500)});throw new Error("Unable to retrieve voting data");}
   return res.json();
  }
  const [questions,options,votes]=await Promise.all([
   read("weigh_in_questions?select=id,episode_number,question,published,created_at&order=episode_number.asc,created_at.asc"),
   read("weigh_in_options?select=id,question_id,option_text,display_order&order=display_order.asc"),
   read("weigh_in_votes?select=question_id,option_id")
  ]);
  return NextResponse.json({questions:questions.map(q=>({...q,options:options.filter(o=>o.question_id===q.id).map(o=>({...o,votes:votes.filter(v=>v.option_id===o.id).length})),totalVotes:votes.filter(v=>v.question_id===q.id).length})),totalVotes:votes.length},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Weigh In admin error",e.message);return NextResponse.json({error:"Unable to load Weigh In data"},{status:503})}
}
async function authorizeWrite(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
 const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
 if(!token||!base||!pub||!secret)return null;
 const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token},cache:"no-store"});
 if(!userRes.ok)return null;
 const user=await userRes.json();if(!user.id)return null;
 const check=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers:{apikey:secret},cache:"no-store"});
 if(!check.ok)throw new Error("Admin authorization unavailable");
 return (await check.json()).length?{base,headers:{apikey:secret,"Content-Type":"application/json"}}:null;
}
const response=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function db(auth,path,method,body,prefer="return=representation"){
 const res=await fetch(auth.base+"/rest/v1/"+path,{method,headers:{...auth.headers,Prefer:prefer},...(body==null?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 if(!res.ok){console.error("Weigh In write failed",path.split("?")[0],res.status,(await res.text()).slice(0,350));throw new Error("Database update failed");}
 return prefer==="return=minimal"?null:res.json();
}
export async function POST(request){
 let auth;try{auth=await authorizeWrite(request)}catch{return response({error:"Admin service unavailable"},503)}
 if(!auth)return response({error:"Not authorized"},403);
 let body;try{body=await request.json()}catch{return response({error:"Invalid request"},400)}
 const episode=Number(body?.episode_number),question=typeof body?.question==="string"?body.question.trim():"";
 const options=body?.options;
 if(!Number.isSafeInteger(episode)||episode<1||episode>999||question.length<10||question.length>500||!Array.isArray(options)||options.length<2||options.length>8||options.some(o=>typeof o!=="string"||o.trim().length<1||o.trim().length>200)||new Set(options.map(o=>o.trim().toLowerCase())).size!==options.length)return response({error:"Enter an episode number, a question (10–500 characters), and 2–8 distinct answer choices."},400);
 let id;
 try{
  const created=await db(auth,"weigh_in_questions","POST",{episode_number:episode,question,published:false});
  id=created?.[0]?.id;if(!id)throw new Error("Question creation returned no ID");
  await db(auth,"weigh_in_options","POST",options.map((option,i)=>({question_id:id,option_text:option.trim(),display_order:i+1})));
  return response({ok:true,id},201);
 }catch(e){
  if(id){try{const res=await fetch(auth.base+"/rest/v1/weigh_in_questions?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:{...auth.headers,Prefer:"return=minimal"},cache:"no-store"});if(!res.ok)console.error("Weigh In rollback failed",res.status)}catch{console.error("Weigh In rollback unavailable")}}
  return response({error:"Unable to save question. Please try again."},503);
 }
}
export async function PATCH(request){
 let auth;try{auth=await authorizeWrite(request)}catch{return response({error:"Admin service unavailable"},503)}
 if(!auth)return response({error:"Not authorized"},403);
 let body;try{body=await request.json()}catch{return response({error:"Invalid request"},400)}
 if(typeof body?.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)||typeof body.published!=="boolean")return response({error:"Invalid publication update"},400);
 try{
  const updated=await db(auth,"weigh_in_questions?id=eq."+encodeURIComponent(body.id),"PATCH",{published:body.published});
  if(!updated.length)return response({error:"Question not found"},404);
  return response({ok:true});
 }catch{return response({error:"Unable to update publication status"},503)}
}

export async function DELETE(request){
 let auth;try{auth=await authorizeWrite(request)}catch{return response({error:"Admin service unavailable"},503)}
 if(!auth)return response({error:"Not authorized"},403);
 let body;try{body=await request.json()}catch{return response({error:"Invalid request"},400)}
 if(typeof body?.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))return response({error:"Invalid question ID"},400);
 try{
  const path="weigh_in_votes?question_id=eq."+encodeURIComponent(body.id)+"&select=id&limit=1";
  const check=await fetch(auth.base+"/rest/v1/"+path,{headers:auth.headers,cache:"no-store"});
  if(!check.ok)throw new Error("Vote check failed");
  if((await check.json()).length)return response({error:"This question has votes and cannot be deleted. Unpublish it to preserve results."},409);
  const deleted=await fetch(auth.base+"/rest/v1/weigh_in_questions?id=eq."+encodeURIComponent(body.id)+"&select=id",{method:"DELETE",headers:{...auth.headers,Prefer:"return=representation"},cache:"no-store"});
  if(!deleted.ok){const detail=(await deleted.text()).slice(0,300);console.error("Weigh In delete rejected",deleted.status,detail);return response({error:"Database rejected deletion. Check server logs for details."},503)}
  const rows=await deleted.json();
  if(!rows.length)return response({error:"Question not found or deletion not permitted"},404);
  return response({ok:true});
 }catch(e){console.error("Weigh In delete error",e.message);return response({error:"Unable to delete question"},503)}
}
