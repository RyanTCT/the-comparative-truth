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
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
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
 function begin(){setError("");setNotice("");if(!session){setError("Please sign in to participate.");return}setThread(null);setPostCategory(category?.id||categories[0]?.id||"");setWriting(true);setPreview(false)}
 async function publish(event){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const result=await call({kind:"thread",category_id:postCategory,title:title.trim()||body.trim().slice(0,90),body});
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
 const filtered=threads.filter(t=>(!category||t.category_id===category.id)&&[t.title,t.body,profiles[t.author_id]||""].join(" ").toLowerCase().includes(query.toLowerCase())).sort((a,b)=>sort==="oldest"?new Date(a.created_at)-new Date(b.created_at):new Date(b.created_at)-new Date(a.created_at));
 const author=id=>profiles[id]||"Investigator";
 return <main className="community-page">
  <SiteHeader />
  <section className="community-hero"><p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>The Investigation <em>Continues.</em></h1><p>Examine the evidence. Challenge assumptions. Share perspectives. The conversation doesn't end when the episode does.</p><div className="community-principle">CHALLENGE THE ARGUMENT. RESPECT THE INDIVIDUAL.</div></section>
  <section className="community-body">
   {!thread&&<nav className="community-crumb">{category?<><button type="button" onClick={()=>{setCategory(null);setThread(null);setWriting(false)}}>Community</button><span> / {category.title}</span></>:<span>Community</span>}</nav>}
   {error&&<p role="alert" className="investigator-auth-error">{error}</p>}{notice&&<p role="status" className="community-note">{notice}</p>}
   <div className="community-section-heading"><div><p className="section-label">THE COMMUNITY BOARD</p><h2>Join the Conversation</h2></div><span>Public to read · Investigators can participate</span></div>
   <button type="button" className="community-post-prompt" onClick={begin}><span className="community-feed-avatar">{session?author(session.user.id).charAt(0).toUpperCase():"◆"}</span><span>What's on your mind, Investigator?</span><strong>+ Post</strong></button>
   <div className="community-tabs"><button className={!category?"active":""} onClick={()=>{setCategory(null);setVisible(10)}}>All Posts</button>{categories.map(c=><button key={c.id} className={category?.id===c.id?"active":""} onClick={()=>{setCategory(c);setVisible(10)}}>{c.title}</button>)}</div>
   <div className="community-tools"><div className="community-search-group">{searchOpen&&<input autoFocus aria-label="Search posts" placeholder="Search posts" value={query} onChange={e=>setQuery(e.target.value)}/>}<button type="button" className="community-search-toggle" aria-label="Search posts" onClick={()=>{setSearchOpen(v=>!v);setQuery("")}}>⌕</button></div><select aria-label="Sort posts" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option></select></div>
   {loading?<p>Loading posts…</p>:<div className="community-post-feed">{filtered.slice(0,visible).map(t=><article className="community-feed-post" key={t.id}><h3 className="community-feed-title">{t.title}</h3><div className="community-feed-author"><span className="community-feed-avatar">{author(t.author_id).charAt(0).toUpperCase()}</span><span><strong>{author(t.author_id)}</strong><small>Investigator · {new Date(t.created_at).toLocaleDateString()}</small></span></div><p className="community-feed-preview">{t.body}</p>{session?.user?.id===t.author_id&&t.title!=="Investigation Withdrawn"&&<div className="community-owner-actions"><button onClick={()=>beginEdit("thread",t)}>Edit</button><button disabled={busy} onClick={()=>removeOwn("withdraw_thread",t.id)}>Delete</button></div>}<div className="community-feed-actions"><button type="button" disabled title="Likes will be enabled when like storage is available">♡ <span>Like</span></button><button type="button" onClick={async()=>{if(!expanded[t.id]){const {data,error}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",t.id).order("created_at");if(!error)setReplyMap(v=>({...v,[t.id]:data||[]}))}setExpanded(v=>({...v,[t.id]:true}));setReplyOpen(v=>({...v,[t.id]:true}))}}>↩ <span>Reply</span></button><button type="button" onClick={async()=>{if(!expanded[t.id]){const {data,error}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",t.id).order("created_at");if(!error)setReplyMap(v=>({...v,[t.id]:data||[]}))}setExpanded(v=>({...v,[t.id]:!v[t.id]}))}}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h7l2 2h9v11H3z"/></svg><span>{replyCounts[t.id]||0} Evidence & Replies</span></button></div>{expanded[t.id]&&<div className="community-inline-replies">{(replyMap[t.id]||[]).map(c=><div className="community-inline-reply" key={c.id}><div className="community-feed-author"><span className="community-feed-avatar">{author(c.author_id).charAt(0).toUpperCase()}</span><span><strong>{author(c.author_id)}</strong><small>{new Date(c.created_at).toLocaleDateString()}</small></span></div><p>{c.body}</p></div>)}{!replyMap[t.id]?.length&&<p className="community-note">No replies yet. Start the conversation.</p>}{!t.is_locked&&(replyOpen[t.id]?<form className="community-inline-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");try{await call({kind:"comment",thread_id:t.id,body:replyDrafts[t.id]||""});const {data}=await getSupabase().from("community_comments").select("id,thread_id,author_id,body,created_at,updated_at").eq("thread_id",t.id).order("created_at");setReplyMap(v=>({...v,[t.id]:data||[]}));setReplyCounts(v=>({...v,[t.id]:(data||[]).length}));setReplyDrafts(v=>({...v,[t.id]:""}));setReplyOpen(v=>({...v,[t.id]:false}))}catch(err){if(err.code==="GUIDELINES_REQUIRED"){setChecked(false);setGuidelines(true)}setError(err.message)}finally{setBusy(false)}}}><textarea autoFocus required minLength={2} maxLength={2000} rows={3} placeholder="Write a reply or share a source…" value={replyDrafts[t.id]||""} onChange={e=>setReplyDrafts(v=>({...v,[t.id]:e.target.value}))}/><div><button type="button" onClick={()=>setReplyOpen(v=>({...v,[t.id]:false}))}>Cancel</button><button className="community-action" disabled={busy}>Post Reply</button></div></form>:<button className="community-reply-prompt" onClick={()=>{if(!session){setError("Please sign in to reply.");return}setReplyOpen(v=>({...v,[t.id]:true}))}}>Write a reply…</button>)}</div>}</article>)}{!filtered.length&&<p className="community-note">No posts here yet. Be the first to start a conversation.</p>}</div>}{filtered.length>visible&&<button className="community-action" onClick={()=>setVisible(v=>v+10)}>Show More</button>}
   {editing&&<form className="community-compose" onSubmit={applyEdit}><h3>{editing.kind==="thread"?"Edit Investigation":"Edit Evidence"}</h3>{editing.kind==="thread"&&<label>Investigation title<input required minLength={5} maxLength={120} value={editing.title} onChange={e=>setEditing(v=>({...v,title:e.target.value}))}/></label>}<label>Evidence<textarea required rows={6} minLength={editing.kind==="thread"?10:2} maxLength={editing.kind==="thread"?5000:2000} value={editing.body} onChange={e=>setEditing(v=>({...v,body:e.target.value}))}/></label><div className="community-actions"><button className="community-action" disabled={busy}>{busy?"Saving…":"Save Changes"}</button><button type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form>}
   {writing&&<div className="community-dialog-overlay"><form className="community-compose community-dialog" role="dialog" aria-modal="true" aria-label="Create post" onSubmit={publish}><div className="community-dialog-header"><h3>Create a Post</h3><button type="button" onClick={()=>setWriting(false)} aria-label="Close">×</button></div><p>Share an idea, question, or something worth discussing.</p><label>Category<select required value={postCategory} onChange={e=>setPostCategory(e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Topic (optional)<input maxLength={120} placeholder="Give your post a topic if you'd like" value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Your Post<textarea required minLength={10} maxLength={5000} rows={6} placeholder="What's on your mind?" value={body} onChange={e=>setBody(e.target.value)}/></label><div className="community-actions"><button type="button" onClick={()=>setWriting(false)}>Cancel</button><button className="community-action" disabled={busy||!postCategory}>{busy?"Posting…":"Post"}</button></div></form></div>}
   {guidelines&&<div className="community-modal" role="dialog" aria-modal="true" aria-label="Community Guidelines"><div><h2>Community Guidelines v1.0</h2><p>{RULES}</p><label><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I have read and agree to these guidelines.</label><div className="community-actions"><button className="community-action" disabled={!checked||busy} onClick={agree}>Accept Guidelines</button><button onClick={()=>setGuidelines(false)}>Cancel</button></div></div></div>}
  </section><footer className="community-footer"><button type="button" className="community-footer-back" onClick={()=>{setCategory(null);setThread(null);setWriting(false);setQuery("");setVisible(10);setNotice("");setError("");window.scrollTo({top:0,behavior:"smooth"})}}>← BACK TO COMMUNITY</button><span>OBSERVE. COMPARE. DISCERN. AND UNDERSTAND.</span></footer>
 </main>;
}