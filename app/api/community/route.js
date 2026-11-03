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
 // PostgREST may return 201 Created with an empty body for Prefer: return=minimal.
 // Do not parse an empty response as JSON: the database write may have succeeded.
 const raw=await response.text();
 if(!raw.trim())return null;
 try{return JSON.parse(raw)}catch{throw Error("Unexpected database response format")}
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
async function notify(recipient,actor,type,title,message,url,preference){
 if(!recipient||recipient===actor)return;
 try{
  if(preference){const prefs=await database("investigator_notification_preferences?user_id=eq."+encodeURIComponent(recipient)+"&select="+preference);if(prefs[0]?.[preference]===false)return}
  await database("investigator_notifications","POST",{recipient_id:recipient,actor_id:actor,notification_type:type,title,message,target_url:url},"return=minimal");
 }catch(e){console.error("Notification delivery failed",e.message)}
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
  if(!["accept","thread","comment","edit_thread","edit_comment","delete_comment","withdraw_thread","toggle_like"].includes(data.kind))return reply({error:"Unknown action."},400);
  if(data.kind==="accept"){
   if(data.accept!==true)return reply({error:"You must accept the Community Guidelines."},400);
   await database("community_guideline_acceptances?on_conflict=user_id","POST",{user_id:user.id,version:VERSION,accepted_at:new Date().toISOString()},"resolution=merge-duplicates,return=minimal");
   return reply({ok:true});
  }
  if(data.kind==="toggle_thread_like"){
   const id=data.thread_id;
   if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return reply({error:"Invalid investigation."},400);
   const threads=await database("community_threads?id=eq."+encodeURIComponent(id)+"&select=id,author_id,is_hidden,is_locked");
   const thread=threads[0];
   if(!thread||thread.is_hidden)return reply({error:"Investigation not found."},404);
   if(thread.author_id===user.id)return reply({error:"You cannot like your own investigation."},403);
   if(thread.is_locked)return reply({error:"This investigation is closed."},403);
   const filter="thread_id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(user.id);
   const existing=await database("community_thread_likes?"+filter+"&select=thread_id");
   if(existing.length)await database("community_thread_likes?"+filter,"DELETE",undefined,"return=minimal");
   else await database("community_thread_likes","POST",{thread_id:id,user_id:user.id},"return=minimal");
   return reply({ok:true,liked:!existing.length});
  }
  if(data.kind==="toggle_like"){
   const id=data.comment_id;
   if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return reply({error:"Invalid contribution."},400);
   const rows=await database("community_comments?id=eq."+encodeURIComponent(id)+"&select=id,author_id,thread_id,is_hidden");
   const comment=rows[0];
   if(!comment||comment.is_hidden)return reply({error:"Contribution not found."},404);
   if(comment.author_id===user.id)return reply({error:"You cannot like your own contribution."},403);
   const parent=await database("community_threads?id=eq."+encodeURIComponent(comment.thread_id)+"&select=is_hidden,is_locked");
   if(!parent.length||parent[0].is_hidden||parent[0].is_locked)return reply({error:"This investigation is closed."},403);
   const filter="comment_id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(user.id);
   const existing=await database("community_comment_likes?"+filter+"&select=comment_id");
   if(existing.length)await database("community_comment_likes?"+filter,"DELETE",undefined,"return=minimal");
   else await database("community_comment_likes","POST",{comment_id:id,user_id:user.id},"return=minimal");
   return reply({ok:true,liked:!existing.length});
  }
  const acceptance=await database("community_guideline_acceptances?user_id=eq."+encodeURIComponent(user.id)+"&version=eq."+VERSION+"&select=user_id");
  if(!acceptance.length)return reply({error:"Please accept the Community Guidelines before posting.",code:"GUIDELINES_REQUIRED"},403);
  if(["edit_thread","edit_comment","delete_comment","withdraw_thread"].includes(data.kind)){
   const isThread=data.kind.endsWith("thread");
   const id=isThread?data.thread_id:data.comment_id;
   if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return reply({error:"Invalid contribution."},400);
   const table=isThread?"community_threads":"community_comments";
   const records=await database(table+"?id=eq."+encodeURIComponent(id)+"&select=*");
   const record=records[0];
   if(!record||record.is_hidden)return reply({error:"Contribution not found."},404);
   if(record.author_id!==user.id)return reply({error:"You can only manage your own contributions."},403);
   if(data.kind==="edit_thread"){
    if(record.is_locked)return reply({error:"This investigation is locked."},403);
    const title=typeof data.title==="string"?data.title.trim():"";
    const body=typeof data.body==="string"?data.body.trim():"";
    if(title.length<5||title.length>120||body.length<10||body.length>5000)return reply({error:"Title must be 5–120 characters and opening evidence 10–5,000 characters."},400);
    if(await screen(title+"\n"+body))return reply({error:"This edit requires moderator review and was not published."},422);
    await database(table+"?id=eq."+encodeURIComponent(id)+"&author_id=eq."+encodeURIComponent(user.id),"PATCH",{title,body,updated_at:new Date().toISOString()},"return=minimal");
    return reply({ok:true});
   }
   if(data.kind==="edit_comment"){
    const parent=await database("community_threads?id=eq."+encodeURIComponent(record.thread_id)+"&select=is_hidden,is_locked");
    if(!parent.length||parent[0].is_hidden||parent[0].is_locked)return reply({error:"This investigation is closed."},403);
    const body=typeof data.body==="string"?data.body.trim():"";
    if(body.length<2||body.length>2000)return reply({error:"Evidence must be 2–2,000 characters."},400);
    if(await screen(body))return reply({error:"This edit requires moderator review and was not published."},422);
    await database(table+"?id=eq."+encodeURIComponent(id)+"&author_id=eq."+encodeURIComponent(user.id),"PATCH",{body,updated_at:new Date().toISOString()},"return=minimal");
    return reply({ok:true});
   }
   if(data.kind==="delete_comment"){
    await database(table+"?id=eq."+encodeURIComponent(id)+"&author_id=eq."+encodeURIComponent(user.id),"DELETE",undefined,"return=minimal");
    return reply({ok:true});
   }
   const replies=await database("community_comments?thread_id=eq."+encodeURIComponent(id)+"&select=id&limit=1");
   if(replies.length){
    // Preserve existing contributions while closing and anonymizing the opening evidence.
    await database(table+"?id=eq."+encodeURIComponent(id)+"&author_id=eq."+encodeURIComponent(user.id),"PATCH",{title:"Investigation Withdrawn",body:"This investigation was withdrawn by its author. Existing replies have been preserved to maintain the continuity of the discussion.",is_locked:true,updated_at:new Date().toISOString()},"return=minimal");
    return reply({ok:true,withdrawn:true});
   }
   await database(table+"?id=eq."+encodeURIComponent(id)+"&author_id=eq."+encodeURIComponent(user.id),"PATCH",{is_hidden:true,is_locked:true,updated_at:new Date().toISOString()},"return=minimal");
   return reply({ok:true,withdrawn:true});
  }
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
  const threads=await database("community_threads?id=eq."+encodeURIComponent(data.thread_id)+"&select=id,is_locked,is_hidden,author_id,title");
  if(!threads.length||threads[0].is_hidden)return reply({error:"Investigation not found."},404);
  if(threads[0].is_locked)return reply({error:"This investigation is closed."},403);
  if(await screen(body))return reply({error:"This contribution requires moderator review and was not published."},422);
  let parentId=null;let replyTarget=null;
  if(data.parent_comment_id!=null){
   if(typeof data.parent_comment_id!=="string"||!/^[0-9a-f-]{36}$/i.test(data.parent_comment_id))return reply({error:"Invalid reply target."},400);
   const target=await database("community_comments?id=eq."+encodeURIComponent(data.parent_comment_id)+"&select=id,thread_id,parent_comment_id,is_hidden,author_id");
   if(!target.length||target[0].is_hidden||target[0].thread_id!==data.thread_id)return reply({error:"Reply target not found."},404);
   parentId=target[0].parent_comment_id||target[0].id;replyTarget=target[0];
  }
  const inserted=await database("community_comments","POST",{thread_id:data.thread_id,author_id:user.id,body,parent_comment_id:parentId,reply_to_comment_id:data.parent_comment_id||null},"return=representation");
  const notificationUrl="/community?thread="+encodeURIComponent(data.thread_id)+"&comment="+encodeURIComponent(inserted?.[0]?.id||"");
  if(replyTarget)await notify(replyTarget.author_id,user.id,"reply","New reply to your contribution","An Investigator replied to your evidence.",notificationUrl,"reply_alerts");
  else await notify(threads[0].author_id,user.id,"thread_reply","New evidence in your investigation","An Investigator contributed to your discussion.",notificationUrl,"thread_reply_alerts");
  const selected=Array.isArray(data.mentioned_user_ids)?[...new Set(data.mentioned_user_ids)].slice(0,10):[];
  if(selected.length&&inserted?.[0]?.id){
   const matches=await database("investigator_profiles?user_id=in.("+selected.filter(x=>typeof x==="string"&&/^[0-9a-f-]{36}$/i.test(x)).map(encodeURIComponent).join(",")+")&select=user_id,display_name");
   const valid=(matches||[]).filter(p=>p.user_id!==user.id&&body.toLowerCase().split(/[^a-z0-9_@]+/).includes("@"+p.display_name.toLowerCase()));
   if(valid.length){try{await database("community_mentions","POST",valid.map(p=>({comment_id:inserted[0].id,mentioned_user_id:p.user_id})),"return=minimal")}catch(mentionError){console.error("Reply published but mention indexing failed",mentionError.message)}await Promise.all(valid.map(p=>notify(p.user_id,user.id,"mention","You were mentioned","An Investigator mentioned you in a Community reply.",notificationUrl,"mention_alerts")))}
  }
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
export async function GET(request){
 try{
  const url=new URL(request.url);const kind=url.searchParams.get("kind");if(!["likes","thread_likes"].includes(kind))return reply({error:"Unknown request."},400);
  const ids=(url.searchParams.get("ids")||"").split(",").filter(id=>/^[0-9a-f-]{36}$/i.test(id)).slice(0,100);
  if(!ids.length)return reply({likes:[]});
  const rows=kind==="thread_likes"?await database("community_thread_likes?thread_id=in.("+ids.map(encodeURIComponent).join(",")+")&select=thread_id,user_id"):await database("community_comment_likes?comment_id=in.("+ids.map(encodeURIComponent).join(",")+")&select=comment_id,user_id");
  return reply({likes:rows||[]});
 }catch(e){console.error("Community like read failed",e.message);return reply({error:"Unable to load likes."},503)}
}
