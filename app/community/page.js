"use client";
import "./community.css";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import {createClient} from "@supabase/supabase-js";
let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
 return browserSupabase;
}
const RULES="Challenge the argument. Respect the individual. Share sources when possible. No harassment, threats, hateful abuse, spam, impersonation, or sharing private information. Contributions may be moderated.";
export default function Community(){
 const [categories,setCategories]=useState([]),[threads,setThreads]=useState([]),[comments,setComments]=useState([]),[profiles,setProfiles]=useState({}),[replyCounts,setReplyCounts]=useState({});
 const [category,setCategory]=useState(null),[thread,setThread]=useState(null),[session,setSession]=useState(null),[expanded,setExpanded]=useState({}),[replyMap,setReplyMap]=useState({}),[replyDrafts,setReplyDrafts]=useState({}),[replyOpen,setReplyOpen]=useState({}),[postCategory,setPostCategory]=useState("");
 const [sectionLimits,setSectionLimits]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [writing,setWriting]=useState(false),[title,setTitle]=useState(""),[body,setBody]=useState(""),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false);
 const [editing,setEditing]=useState(null),[guidelines,setGuidelines]=useState(false),[checked,setChecked]=useState(false),[searchOpen,setSearchOpen]=useState(false),[sort,setSort]=useState("newest"),[query,setQuery]=useState(""),[visible,setVisible]=useState(10),[commentPage,setCommentPage]=useState(1);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const [c,t,p,replies]=await Promise.all([
   getSupabase().from("community_categories").select("id,slug,title,description,sort_order").order("sort_order"),
   getSupabase().from("community_threads").select("id,category_id,author_id,title,body,created_at,updated_at,is_locked").order("created_at",{ascending:false}).limit(500),
   getSupabase().from("investigator_profiles").select("user_id,display_name").limit(1000),
   getSupabase().from("community_comments").select("thread_id").limit(1000)
  ]);
  if(c.error||t.error)setError("Unable to load Community discussions.");
  else{setCategories(c.data||[]);setThreads(t.data||[]);setProfiles(Object.fromEntries((p.data||[]).map(x=>[x.user_id,x.display_name])));if(!replies.error){const counts={};for(const r of replies.data||[])counts[r.thread_id]=(counts[r.thread_id]||0)+1;setReplyCounts(counts)}}
  setLoading(false);
 },[]);
 const loadComments=useCallback(async id=>{
  const {data,error}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",id).order("created_at");
  if(error)setError("Unable to load evidence.");else setComments(data||[]);
 },[]);
 useEffect(()=>{load();getSupabase().auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=getSupabase().auth.onAuthStateChange((_event,s)=>setSession(s));return()=>subscription.unsubscribe()},[load]);
 useEffect(()=>{if(thread)loadComments(thread.id);else setComments([])},[thread,loadComments]);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get("thread");if(!id||!threads.length||!categories.length)return;const match=threads.find(t=>t.id===id);if(match){setCategory(categories.find(c=>c.id===match.category_id)||null);setThread(match);setCommentPage(1)}},[threads,categories]);
 async function call(payload){
  const {data}=await getSupabase().auth.getSession();
  if(!data.session?.access_token)throw Error("Please sign in to participate.");
  const response=await fetch("/api/community",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+data.session.access_token},body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok){const failure=Error(result.error||"Unable to publish.");failure.code=result.code;throw failure}
  return result;
 }
 function beginEdit(kind,item){setError("");setNotice("");setWriting(false);setEditing({kind,id:item.id,title:item.title||"",body:item.body});}
 async function applyEdit(event){
  event.preventDefault();if(!editing)return;
  setBusy(true);setError("");
  try{
   const payload=editing.kind==="thread"?{kind:"edit_thread",thread_id:editing.id,title:editing.title,body:editing.body}:{kind:"edit_comment",comment_id:editing.id,body:editing.body};
   await call(payload);
   if(editing.kind==="thread"){
    
    await load();
   }else await loadComments(thread.id);
   setEditing(null);setNotice("Your changes have been saved.");
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function removeOwn(kind,id){
  const message=kind==="withdraw_thread"?"Withdraw this investigation? If replies exist, they will remain visible and the investigation will close.":"Delete this Evidence Contribution permanently?";
  if(!window.confirm(message))return;
  setBusy(true);setError("");
  try{
   await call(kind==="withdraw_thread"?{kind,thread_id:id}:{kind,comment_id:id});
   setEditing(null);
   if(kind==="withdraw_thread"){setThread(null);setWriting(false);await load();setNotice("Post deleted.")}
   else{await loadComments(thread.id);setNotice("Evidence Contribution deleted.")}
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 function begin(){setError("");setNotice("");if(!session){setError("Please sign in to participate.");return}setThread(null);setPostCategory(categories[0]?.id||"");setWriting(true);setPreview(false)}
 async function publish(event){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   await call({kind:"thread",category_id:postCategory,title:title.trim()||body.trim().slice(0,90),body});
   await load();
   setBody("");setTitle("");setWriting(false);setPreview(false);setNotice("Your contribution has been published.");
  }catch(e){if(e.code==="GUIDELINES_REQUIRED"){setChecked(false);setGuidelines(true);setError("Please accept the Community Guidelines to publish.")}else setError(e.message)}
  finally{setBusy(false)}
 }
 async function agree(){
  setBusy(true);setError("");
  try{await call({kind:"accept",accept:true});setGuidelines(false);setError("");setNotice("Guidelines accepted. Your draft is still here—press Publish to finish.")}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 const filtered=threads.filter(t=>[t.title,t.body,profiles[t.author_id]||""].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="oldest"?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
 const author=id=>profiles[id]||"Investigator";
 return <main className="community-page">
  <SiteHeader />
  <section className="community-hero"><p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>The Investigation <em>Continues.</em></h1><p>Examine the evidence. Challenge assumptions. Share perspectives. The conversation doesn't end when the episode does.</p><div className="community-principle">CHALLENGE THE ARGUMENT. RESPECT THE INDIVIDUAL.</div></section>
  <section className="community-body">
   {error&&<p role="alert" className="investigator-auth-error">{error}</p>}{notice&&<p role="status" className="community-note">{notice}</p>}
   <div className="community-section-heading"><div><p className="section-label">THE COMMUNITY BOARD</p><h2>Join the Conversation</h2></div><span>Public to read · Investigators can participate</span></div>
   <button type="button" className="community-post-prompt" onClick={begin}><span className="community-feed-avatar" aria-hidden="true">{session?author(session.user.id).charAt(0).toUpperCase():"+"}</span><span>What's on your mind, Investigator?</span><strong>+ Post</strong></button>
   {loading?<p className="community-note">Loading conversations…</p>:<div className="community-section-list">{categories.map(c=>{const sectionPosts=filtered.filter(t=>t.category_id===c.id);const shown=sectionPosts.slice(0,sectionLimits[c.id]||3);return <section className="community-forum-section" key={c.id} aria-label={c.title}><div className="community-forum-heading"><div><h3>{c.title}</h3><p>{c.description}</p></div><span>{sectionPosts.length} {sectionPosts.length===1?"post":"posts"}</span></div><div className="community-forum-rows">{shown.map(t=><article className="community-forum-entry" key={t.id}><div className="community-forum-row"><span className="community-forum-icon" aria-hidden="true"><svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 6h22v16H14l-7 5v-5H5z"/></svg></span><div className="community-forum-row-main"><button type="button" className="community-forum-title" aria-expanded={!!expanded[t.id]} onClick={async()=>{if(!expanded[t.id]){const {data,error}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",t.id).order("created_at");if(!error)setReplyMap(v=>({...v,[t.id]:data||[]}))}setExpanded(v=>({...v,[t.id]:!v[t.id]}))}}>{t.title}</button><p>{t.body.length>110?t.body.slice(0,110).trimEnd()+"…":t.body}</p><div className="community-forum-meta"><span className="community-mini-avatar" aria-hidden="true">{author(t.author_id).charAt(0).toUpperCase()}</span><span>{author(t.author_id)}</span><span>·</span><time dateTime={t.created_at}>{new Date(t.created_at).toLocaleDateString()}</time></div></div><span className="community-forum-count">↩ {replyCounts[t.id]||0}</span></div>{expanded[t.id]&&<div className="community-forum-expanded"><p className="community-full-post">{t.body}</p>{session?.user?.id===t.author_id&&t.title!=="Investigation Withdrawn"&&<div className="community-owner-actions"><button onClick={()=>beginEdit("thread",t)}>Edit</button><button disabled={busy} onClick={()=>removeOwn("withdraw_thread",t.id)}>Delete</button></div>}<div className="community-feed-actions"><button type="button" disabled title="Likes will be available once storage is connected">♡ <span>Like</span></button><button type="button" onClick={()=>{if(!session){setError("Please sign in to reply.");return}setReplyOpen(v=>({...v,[t.id]:true}))}}>↩ <span>Reply</span></button><span className="community-reply-count">{replyCounts[t.id]||0} Evidence & Replies</span></div><div className="community-inline-replies">{(replyMap[t.id]||[]).map(r=><div className="community-inline-reply" key={r.id}><div className="community-feed-author"><span className="community-feed-avatar">{author(r.author_id).charAt(0).toUpperCase()}</span><span><strong>{author(r.author_id)}</strong><small>{new Date(r.created_at).toLocaleDateString()}</small></span></div><p>{r.body}</p></div>)}{!replyMap[t.id]?.length&&<p className="community-empty-replies">No replies yet.</p>}{!t.is_locked&&(replyOpen[t.id]?<form className="community-inline-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");try{await call({kind:"comment",thread_id:t.id,body:replyDrafts[t.id]||""});const {data}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",t.id).order("created_at");setReplyMap(v=>({...v,[t.id]:data||[]}));setReplyCounts(v=>({...v,[t.id]:(data||[]).length}));setReplyDrafts(v=>({...v,[t.id]:""}));setReplyOpen(v=>({...v,[t.id]:false}))}catch(err){if(err.code==="GUIDELINES_REQUIRED"){setChecked(false);setGuidelines(true)}setError(err.message)}finally{setBusy(false)}}}><textarea autoFocus required minLength={2} maxLength={2000} rows={3} placeholder="Write a reply or share a source…" value={replyDrafts[t.id]||""} onChange={e=>setReplyDrafts(v=>({...v,[t.id]:e.target.value}))}/><div><button type="button" onClick={()=>setReplyOpen(v=>({...v,[t.id]:false}))}>Cancel</button><button className="community-action" disabled={busy}>Post Reply</button></div></form>:<button className="community-reply-prompt" onClick={()=>{if(!session){setError("Please sign in to reply.");return}setReplyOpen(v=>({...v,[t.id]:true}))}}>Write a reply…</button>)}</div></div>}</article>)}{!sectionPosts.length&&<p className="community-forum-empty">No posts yet. Start the conversation.</p>}</div>{sectionPosts.length>3&&<button type="button" className="community-forum-more" onClick={()=>setSectionLimits(v=>({...v,[c.id]:(v[c.id]||3)>=sectionPosts.length?3:sectionPosts.length}))}>{(sectionLimits[c.id]||3)>=sectionPosts.length?"Show Less ↑":"See More "+c.title+" ↓"}</button>}</section>})}</div>}
   {editing&&<form className="community-compose" onSubmit={applyEdit}><h3>{editing.kind==="thread"?"Edit Investigation":"Edit Evidence"}</h3>{editing.kind==="thread"&&<label>Investigation title<input required minLength={5} maxLength={120} value={editing.title} onChange={e=>setEditing(v=>({...v,title:e.target.value}))}/></label>}<label>Evidence<textarea required rows={6} minLength={editing.kind==="thread"?10:2} maxLength={editing.kind==="thread"?5000:2000} value={editing.body} onChange={e=>setEditing(v=>({...v,body:e.target.value}))}/></label><div className="community-actions"><button className="community-action" disabled={busy}>{busy?"Saving…":"Save Changes"}</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form>}
   {writing&&<div className="community-dialog-overlay"><form className="community-compose community-dialog" role="dialog" aria-modal="true" aria-label="Create post" onSubmit={publish}><div className="community-dialog-header"><h3>Create a Post</h3><button type="button" onClick={()=>setWriting(false)} aria-label="Close">×</button></div><p>Share an idea, question, or something worth discussing.</p><label>Category<select required value={postCategory} onChange={e=>setPostCategory(e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Topic (optional)<input maxLength={120} placeholder="Give your post a topic if you'd like" value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Your Post<textarea required minLength={10} maxLength={5000} rows={6} placeholder="What's on your mind?" value={body} onChange={e=>setBody(e.target.value)}/></label><div className="community-actions"><button type="button" onClick={()=>setWriting(false)}>Cancel</button><button className="community-action" disabled={busy||!postCategory}>{busy?"Posting…":"Post"}</button></div></form></div>}
   {guidelines&&<div className="community-modal" role="dialog" aria-modal="true" aria-label="Community Guidelines"><div><h2>Community Guidelines v1.0</h2><p>{RULES}</p><label><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I have read and agree to these guidelines.</label><div className="community-actions"><button className="community-action" disabled={!checked||busy} onClick={agree}>Accept Guidelines</button><button onClick={()=>setGuidelines(false)}>Cancel</button></div></div></div>}
  </section><footer className="community-footer"><button type="button" className="community-footer-back" onClick={()=>{setCategory(null);setThread(null);setWriting(false);setQuery("");setVisible(10);setNotice("");setError("");window.scrollTo({top:0,behavior:"smooth"})}}>← BACK TO COMMUNITY</button><span>OBSERVE. COMPARE. DISCERN. AND UNDERSTAND.</span></footer>
 </main>;
}