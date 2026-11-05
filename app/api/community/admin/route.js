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
 const rows=await db("admin_users?user_id=eq."+encodeURIComponent(u.id)+"&select=user_id");
 if(rows.length)return {...u,isAdmin:true};
 const moderators=await db("investigator_moderators?user_id=eq."+encodeURIComponent(u.id)+"&select=user_id");
 return moderators.length?{...u,isAdmin:false}:null;
}
const uuid=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
async function handler(request){
 if(!base||!publicKey||!secret)return json({error:"Administration unavailable."},503);
 try{
  const user=await admin(request);
  if(!user)return json({error:"Moderator access required."},403);
  if(request.method==="GET"){
   const [threads,comments,categories,history]=await Promise.all([
    db("community_threads?select=id,title,body,category_id,author_id,created_at,is_locked,is_hidden,is_pinned&order=created_at.desc&limit=300"),
    db("community_comments?select=id,thread_id,author_id,body,created_at,is_hidden&order=created_at.desc&limit=300"),
    db("community_categories?select=id,title&order=sort_order.asc"),
    db("community_moderation_log?select=id,action,target_type,target_id,detail,created_at&order=created_at.desc&limit=100")
   ]);
   const pending=await db("community_moderation_queue?select=*&status=eq.pending&order=created_at.asc&limit=150");
   return json({threads:user.isAdmin?threads:[],comments:user.isAdmin?comments:[],categories,history:user.isAdmin?history:[],pending,isAdmin:user.isAdmin,viewerId:user.id});
  }
  const data=await request.json();

  if(["approve_pending","reject_pending"].includes(data.action)){
   if(!uuid(data.id))return json({error:"Invalid review case."},400);
   const cases=await db("community_moderation_queue?id=eq."+encodeURIComponent(data.id)+"&status=eq.pending&select=*");
   const item=cases[0];if(!item)return json({error:"Pending case not found."},404);
   if(item.author_id===user.id)return json({error:"You cannot review your own submission."},403);
   const rejectionReasons=["Threats or intimidation","Harassment or bullying","Hateful or discriminatory conduct","Personal information or doxxing","Spam or deceptive content","Graphic or inappropriate content","Other Community Guidelines violation"];
   const reason=typeof data.reason==="string"?data.reason:"";
   if(data.action==="reject_pending"&&!rejectionReasons.includes(reason))return json({error:"Select a valid rejection reason."},400);
   const explanation=typeof data.explanation==="string"?data.explanation.trim().slice(0,350):"";
   const reviewNote=data.action==="reject_pending"?reason+(explanation?" — "+explanation:""):null;
   const now=new Date().toISOString(),decision=data.action==="approve_pending"?"approved":"rejected";
   const claim=await db("community_moderation_queue?id=eq."+encodeURIComponent(item.id)+"&status=eq.pending","PATCH",{status:decision,reviewed_by:user.id,reviewed_at:now,review_note:reviewNote});
   if(!claim.length)return json({error:"This case has already been reviewed."},409);
   let published=null;
   try{
    if(decision==="approved"){
     if(item.submission_type==="thread"){
      const categories=await db("community_categories?id=eq."+encodeURIComponent(item.category_id)+"&select=id");
      if(!categories.length)throw Error("Original category is unavailable");
      const rows=await db("community_threads","POST",{author_id:item.author_id,category_id:item.category_id,title:item.title,body:item.body});
      published="/community?thread="+encodeURIComponent(rows[0].id);
     }else if(item.submission_type==="comment"){
      const threads=await db("community_threads?id=eq."+encodeURIComponent(item.thread_id)+"&select=id,is_hidden,is_locked");
      if(!threads.length||threads[0].is_hidden||threads[0].is_locked)throw Error("Original investigation is closed");
      if(item.parent_comment_id){
       const parents=await db("community_comments?id=eq."+encodeURIComponent(item.parent_comment_id)+"&select=id,thread_id,is_hidden,parent_comment_id");
       if(!parents.length||parents[0].is_hidden||parents[0].thread_id!==item.thread_id||parents[0].parent_comment_id)throw Error("Reply parent is unavailable");
      }
      const rows=await db("community_comments","POST",{author_id:item.author_id,thread_id:item.thread_id,body:item.body,parent_comment_id:item.parent_comment_id,reply_to_comment_id:item.reply_to_comment_id});
      published="/community?thread="+encodeURIComponent(item.thread_id)+"&comment="+encodeURIComponent(rows[0].id);
     }else{
      const isThread=item.submission_type==="edit_thread",table=isThread?"community_threads":"community_comments";
      if(!uuid(item.target_id))throw Error("Original content is unavailable");
      const records=await db(table+"?id=eq."+encodeURIComponent(item.target_id)+"&select=*");
      const record=records[0];
      if(!record||record.is_hidden||record.author_id!==item.author_id)throw Error("Original content is unavailable");
      const thread=isThread?record:(await db("community_threads?id=eq."+encodeURIComponent(record.thread_id)+"&select=*"))[0];
      if(!thread||thread.is_hidden||thread.is_locked)throw Error("Original investigation is closed");
      await db(table+"?id=eq."+encodeURIComponent(item.target_id),"PATCH",isThread?{title:item.title,body:item.body,updated_at:now}:{body:item.body,updated_at:now});
      published="/community?thread="+encodeURIComponent(isThread?item.target_id:record.thread_id)+(isThread?"":"&comment="+encodeURIComponent(item.target_id));
     }
    }
   }catch(e){
    await db("community_moderation_queue?id=eq."+encodeURIComponent(item.id)+"&reviewed_by=eq."+encodeURIComponent(user.id),"PATCH",{status:"pending",reviewed_by:null,reviewed_at:null,review_note:null});
    return json({error:"Unable to publish approved content: "+e.message},409);
   }
   try{await db("investigator_notifications","POST",{recipient_id:item.author_id,actor_id:user.id,notification_type:"moderation_decision",title:decision==="approved"?"Your contribution was approved":"Your contribution was not approved",message:decision==="approved"?"Your contribution has been approved and published.":"Reason: "+reason+". "+(explanation?explanation+" ":"")+"Your contribution was not approved under the Community Guidelines.",target_url:published||"/community"})}catch(e){console.error("Moderation decision notification failed",e.message)}
   return json({ok:true,status:decision});
  }
  if(!user.isAdmin)return json({error:"Administrator access required for this action."},403);
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
