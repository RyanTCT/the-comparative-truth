import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const VERSION="1.0";
const reply=(value,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret=process.env.SUPABASE_SECRET_KEY;
async function database(path,method="GET",body,prefer){
 const response=await fetch(base+"/rest/v1/"+path,{method,headers:{apikey:secret,"Content-Type":"application/json",...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 if(!response.ok){
  const detail=await response.json().catch(()=>({}));
  const code=typeof detail.code==="string"?detail.code:"";
  console.error("Community database operation failed",{status:response.status,code,operation:method,resource:path.split("?")[0]});
  const error=new Error("Database operation failed");error.dbStatus=response.status;error.dbCode=code;throw error;
 }
 return response.status===204?null:response.json();
}
async function userFor(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return null;
 const response=await fetch(base+"/auth/v1/user",{headers:{apikey:publicKey,Authorization:"Bearer "+token},cache:"no-store"});
 if(!response.ok)return null;
 const user=await response.json();
 if(!user.id||!user.email_confirmed_at)return null;
 const profiles=await database("investigator_profiles?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id,display_name");
 return profiles[0]?.display_name?.trim()?user:null;
}
async function screen(text){
 if(!process.env.OPENAI_API_KEY)throw Error("Moderation unavailable");
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),9000);
 try{
  const response=await fetch("https://api.openai.com/v1/moderations",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"omni-moderation-latest",input:text}),signal:controller.signal,cache:"no-store"});
  if(!response.ok)throw Error("Moderation unavailable");
  const result=await response.json();
  if(!Array.isArray(result.results)||!result.results.length)throw Error("Moderation unavailable");
  return result.results.some(item=>item.flagged);
 }finally{clearTimeout(timer)}
}
export async function POST(request){
 if(!base||!publicKey||!secret)return reply({error:"Community configuration unavailable."},503);
 try{
  const user=await userFor(request);
  if(!user)return reply({error:"Sign in with a verified Investigator account and a username to participate."},401);
  const data=await request.json();
  if(!["accept","thread","comment"].includes(data.kind))return reply({error:"Unknown action."},400);
  if(data.kind==="accept"){
   if(data.accept!==true)return reply({error:"You must accept the Community Guidelines."},400);
   await database("community_guideline_acceptances?on_conflict=user_id","POST",{user_id:user.id,version:VERSION,accepted_at:new Date().toISOString()},"resolution=merge-duplicates,return=minimal");
   return reply({ok:true});
  }
  const acceptance=await database("community_guideline_acceptances?user_id=eq."+encodeURIComponent(user.id)+"&version=eq."+VERSION+"&select=user_id");
  if(!acceptance.length)return reply({error:"Please accept the Community Guidelines before posting.",code:"GUIDELINES_REQUIRED"},403);
  const body=typeof data.body==="string"?data.body.trim():"";
  if(data.kind==="thread"){
   const title=typeof data.title==="string"?data.title.trim():"";
   if(title.length<5||title.length>120||body.length<10||body.length>5000)return reply({error:"Title must be 5–120 characters and opening evidence 10–5,000 characters."},400);
   if(!/^[0-9a-f-]{36}$/i.test(data.category_id||""))return reply({error:"Select a category."},400);
   const categories=await database("community_categories?id=eq."+encodeURIComponent(data.category_id)+"&select=id");
   if(!categories.length)return reply({error:"Category not found."},404);
   if(await screen(title+"\n"+body))return reply({error:"This submission requires moderator review and was not published."},422);
   const rows=await database("community_threads","POST",{category_id:data.category_id,author_id:user.id,title,body},"return=representation");
   return reply({ok:true,id:rows[0].id},201);
  }
  if(body.length<2||body.length>2000)return reply({error:"Evidence must be 2–2,000 characters."},400);
  if(!/^[0-9a-f-]{36}$/i.test(data.thread_id||""))return reply({error:"Invalid investigation."},400);
  const threads=await database("community_threads?id=eq."+encodeURIComponent(data.thread_id)+"&select=id,is_locked,is_hidden");
  if(!threads.length||threads[0].is_hidden)return reply({error:"Investigation not found."},404);
  if(threads[0].is_locked)return reply({error:"This investigation is closed."},403);
  if(await screen(body))return reply({error:"This contribution requires moderator review and was not published."},422);
  await database("community_comments","POST",{thread_id:data.thread_id,author_id:user.id,body},"return=minimal");
  return reply({ok:true},201);
 }catch(error){
  console.error("Community posting error:",error.message);
  if(error.dbCode==="P0001")return reply({error:"You have reached the Community posting limit for the last 24 hours."},429);
  if(error.dbCode==="42501"||error.dbStatus===401||error.dbStatus===403)return reply({error:"The Community database rejected this request (permissions). An administrator needs to check the server configuration.",code:"DATABASE_PERMISSIONS"},503);
  if(error.dbCode==="42P01"||error.dbCode==="PGRST205")return reply({error:"A required Community database table is unavailable. Please contact the administrator.",code:"DATABASE_TABLE"},503);
  if(error.message==="Moderation unavailable"||error.name==="AbortError")return reply({error:"Content screening is temporarily unavailable. Your draft has not been published.",code:"MODERATION_UNAVAILABLE"},503);
  return reply({error:"Unable to publish right now. Your draft has been preserved. Please try again later.",code:"POST_FAILED"},503);
 }
}