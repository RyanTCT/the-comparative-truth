import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const json=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
async function authorize(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
 const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
 if(!token||!base||!pub||!secret)return null;
 const userResponse=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token},cache:"no-store"});
 if(!userResponse.ok)return null;
 const user=await userResponse.json();
 if(!uuid(user.id))return null;
 const check=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers:{apikey:secret},cache:"no-store"});
 if(!check.ok)throw Error("Administrator authorization check failed");
 if(!(await check.json()).length)return null;
 return {base,secret,user};
}
async function db(auth,path,method="GET",body){
 const r=await fetch(auth.base+"/rest/v1/"+path,{method,headers:{apikey:auth.secret,"Content-Type":"application/json",Prefer:method==="GET"?"return=representation":"return=minimal"},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 if(!r.ok){const detail=(await r.text()).slice(0,250);console.error("Investigator management database error",r.status,detail);throw Error("Database request failed: "+r.status)}
 if(method!=="GET")return null;
 return r.json();
}
export async function GET(request){
 let auth;try{auth=await authorize(request)}catch{return json({error:"Administrator authorization unavailable."},503)}
 if(!auth)return json({error:"Administrator access required."},403);
 try{
  const profiles=await db(auth,"investigator_profiles?select=user_id,display_name&order=display_name.asc&limit=1000");
  const [threads,comments,admins,moderators]=await Promise.all([
   db(auth,"community_threads?select=id,author_id,title,category_id,created_at&order=created_at.desc&limit=1000"),
   db(auth,"community_comments?select=id,author_id,thread_id,created_at&order=created_at.desc&limit=1000"),
   db(auth,"admin_users?select=user_id"),
   db(auth,"investigator_moderators?select=user_id").catch(()=>null)
  ]);
  return json({profiles,threads,comments,admins:admins.map(x=>x.user_id),moderators:moderators?.map(x=>x.user_id)||[],moderatorRolesReady:moderators!==null,activityLimited:threads.length===1000||comments.length===1000});
 }catch(e){return json({error:"Investigator directory could not load. Verify the existing community tables and administrator access."},503)}
}
export async function PATCH(request){
 let auth;try{auth=await authorize(request)}catch{return json({error:"Administrator authorization unavailable."},503)}
 if(!auth)return json({error:"Administrator access required."},403);
 const data=await request.json().catch(()=>null);
 if(!data||!uuid(data.user_id)||typeof data.moderator!=="boolean")return json({error:"Invalid role change."},400);
 if(data.user_id===auth.user.id)return json({error:"You cannot change your own moderator role here."},400);
 try{
  const profiles=await db(auth,"investigator_profiles?user_id=eq."+encodeURIComponent(data.user_id)+"&select=user_id");
  if(!profiles.length)return json({error:"Investigator not found."},404);
  const admins=await db(auth,"admin_users?user_id=eq."+encodeURIComponent(data.user_id)+"&select=user_id");
  if(admins.length)return json({error:"Administrator permissions are managed separately and cannot be changed here."},400);
  if(data.moderator)await db(auth,"investigator_moderators","POST",{user_id:data.user_id,granted_by:auth.user.id});
  else await db(auth,"investigator_moderators?user_id=eq."+encodeURIComponent(data.user_id),"DELETE");
  return json({ok:true});
 }catch(e){return json({error:"Moderator role update unavailable. Run the reviewed Batch 2 role SQL if it has not been installed."},503)}
}
