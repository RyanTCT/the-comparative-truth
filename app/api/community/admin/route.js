import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret=process.env.SUPABASE_SECRET_KEY;
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function db(path,method="GET",body){
 const r=await fetch(base+"/rest/v1/"+path,{method,headers:{apikey:secret,"Content-Type":"application/json",Prefer:"return=representation"},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 if(!r.ok)throw Error("Database request failed ("+r.status+")");
 const text=await r.text();return text?JSON.parse(text):[];
}
async function admin(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return null;
 const r=await fetch(base+"/auth/v1/user",{headers:{apikey:publicKey,Authorization:"Bearer "+token},cache:"no-store"});
 if(!r.ok)return null;
 const u=await r.json();
 if(!u.id||!u.email_confirmed_at)return null;
 const rows=await db("community_admins?user_id=eq."+encodeURIComponent(u.id)+"&select=user_id");
 return rows.length?u:null;
}
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
async function handler(request){
 if(!base||!publicKey||!secret)return json({error:"Administration unavailable."},503);
 try{
  const user=await admin(request);
  if(!user)return json({error:"Administrator access required."},403);
  if(request.method==="GET"){
   const [threads,comments,categories,history]=await Promise.all([
    db("community_threads?select=id,title,body,category_id,author_id,created_at,is_locked,is_hidden,is_pinned&order=created_at.desc&limit=300"),
    db("community_comments?select=id,thread_id,author_id,body,created_at,is_hidden&order=created_at.desc&limit=300"),
    db("community_categories?select=id,title&order=sort_order.asc"),
    db("community_moderation_log?select=id,action,target_type,target_id,detail,created_at&order=created_at.desc&limit=100")
   ]);
   return json({threads,comments,categories,history});
  }
  const data=await request.json();
  const actions={pin:["thread","is_pinned"],unpin:["thread","is_pinned"],lock:["thread","is_locked"],unlock:["thread","is_locked"],hide_thread:["thread","is_hidden"],restore_thread:["thread","is_hidden"],hide_comment:["comment","is_hidden"],restore_comment:["comment","is_hidden"],move:["thread","category_id"]};
  const rule=actions[data.action];
  if(!rule||!uuid(data.id))return json({error:"Invalid moderation action."},400);
  const table=rule[0]==="thread"?"community_threads":"community_comments";
  const existing=await db(table+"?id=eq."+encodeURIComponent(data.id)+"&select=id");
  if(!existing.length)return json({error:"Content not found."},404);
  let value;
  if(data.action==="move"){
   if(!uuid(data.category_id))return json({error:"Invalid destination category."},400);
   const categories=await db("community_categories?id=eq."+encodeURIComponent(data.category_id)+"&select=id");
   if(!categories.length)return json({error:"Category not found."},404);
   value=data.category_id;
  }else value=["pin","lock","hide_thread","hide_comment"].includes(data.action);
  await db(table+"?id=eq."+encodeURIComponent(data.id),"PATCH",{[rule[1]]:value,updated_at:new Date().toISOString()});
  await db("community_moderation_log","POST",{admin_id:user.id,action:data.action,target_type:rule[0],target_id:data.id,detail:data.action==="move"?"Moved to category "+value:null});
  return json({ok:true});
 }catch(e){console.error("Community administration error:",e.message);return json({error:"Administration request failed. Verify the database setup and try again."},503)}
}
export async function GET(request){return handler(request)}
export async function POST(request){return handler(request)}
