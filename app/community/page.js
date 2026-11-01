"use client";
import "./community.css";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const RULES="Challenge the argument. Respect the individual. Share sources when possible. No harassment, threats, hateful abuse, spam, impersonation, or sharing private information. Contributions may be moderated.";
export default function Community(){
 const [categories,setCategories]=useState([]),[threads,setThreads]=useState([]),[comments,setComments]=useState([]),[profiles,setProfiles]=useState({});
 const [category,setCategory]=useState(null),[thread,setThread]=useState(null),[session,setSession]=useState(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [writing,setWriting]=useState(false),[title,setTitle]=useState(""),[body,setBody]=useState(""),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false);
 const [guidelines,setGuidelines]=useState(false),[checked,setChecked]=useState(false),[searchOpen,setSearchOpen]=useState(false),[sort,setSort]=useState("newest"),[query,setQuery]=useState(""),[visible,setVisible]=useState(10),[commentPage,setCommentPage]=useState(1);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const [c,t,p]=await Promise.all([
   supabase.from("community_categories").select("id,slug,title,description,sort_order").order("sort_order"),
   supabase.from("community_threads").select("id,category_id,author_id,title,body,created_at,updated_at,is_locked").order("created_at",{ascending:false}).limit(500),
   supabase.from("investigator_profiles").select("user_id,display_name").limit(1000)
  ]);
  if(c.error||t.error)setError("Unable to load Community discussions.");
  else{setCategories(c.data||[]);setThreads(t.data||[]);setProfiles(Object.fromEntries((p.data||[]).map(x=>[x.user_id,x.display_name])))}
  setLoading(false);
 },[]);
 const loadComments=useCallback(async id=>{
  const {data,error}=await supabase.from("community_comments").select("id,thread_id,author_id,body,created_at").eq("thread_id",id).order("created_at");
  if(error)setError("Unable to load evidence.");else setComments(data||[]);
 },[]);
 useEffect(()=>{load();supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));return()=>subscription.unsubscribe()},[load]);
 useEffect(()=>{if(thread)loadComments(thread.id);else setComments([])},[thread,loadComments]);
 async function call(payload){
  const {data}=await supabase.auth.getSession();
  if(!data.session?.access_token)throw Error("Please sign in to participate.");
  const response=await fetch("/api/community",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+data.session.access_token},body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok){const failure=Error(result.error||"Unable to publish.");failure.code=result.code;throw failure}
  return result;
 }
 function begin(){setError("");setNotice("");if(!session){setError("Please sign in to participate.");return}setWriting(true);setPreview(false)}
 async function publish(event){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const result=await call(thread?{kind:"comment",thread_id:thread.id,body}:{kind:"thread",category_id:category.id,title,body});
   if(thread)await loadComments(thread.id);
   else{await load();const {data}=await supabase.from("community_threads").select("id,category_id,author_id,title,body,created_at,updated_at,is_locked").eq("id",result.id).single();if(data)setThread(data)}
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
  <header className="community-top"><Link href="/">← THE COMPARATIVE TRUTH</Link><Link href="/investigator/profile">INVESTIGATOR PROFILE →</Link></header>
  <section className="community-hero"><p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>The Investigation <em>Continues.</em></h1><p>Examine the evidence. Challenge assumptions. Share perspectives. The conversation doesn't end when the episode does.</p><div className="community-principle">CHALLENGE THE ARGUMENT. RESPECT THE INDIVIDUAL.</div></section>
  <section className="community-body">
   <nav className="community-crumb"><button onClick={()=>{setCategory(null);setThread(null);setWriting(false)}}>Community</button>{category&&<><span> / </span><button onClick={()=>{setThread(null);setWriting(false)}}>{category.title}</button></>}{thread&&<span> / {thread.title}</span>}</nav>
   {error&&<p role="alert" className="investigator-auth-error">{error}</p>}{notice&&<p role="status" className="community-note">{notice}</p>}
   {loading?<p>Loading discussions…</p>:!category?<><div className="community-section-heading"><div><p className="section-label">DISCUSSION BOARDS</p><h2>Choose an Investigation</h2></div><span>Public to read • Verified Investigators can participate</span></div><div className="community-grid">{categories.map((c,i)=><button type="button" className="community-card" key={c.id} onClick={()=>{setCategory(c);setThread(null);setQuery("");setVisible(10)}}><span className="community-card-number">0{i+1} / INVESTIGATION BOARD</span><h3>{c.title}</h3><p>{c.description}</p><div className="community-card-bottom"><span>{threads.filter(t=>t.category_id===c.id).length} investigations</span><span>EXPLORE →</span></div></button>)}</div><section className="community-recent"><div className="community-section-heading"><div><p className="section-label">FROM THE COMMUNITY</p><h2>Recent Investigations</h2></div><span>Latest conversations across all boards</span></div>{threads.slice(0,6).map(t=><button className="community-thread-row" key={t.id} onClick={()=>{setCategory(categories.find(c=>c.id===t.category_id)||null);setThread(t);setWriting(false);setCommentPage(1)}}><strong>{t.title}</strong><span>{categories.find(c=>c.id===t.category_id)?.title||"Community"} · {author(t.author_id)} · {new Date(t.created_at).toLocaleDateString()}</span></button>)}{!threads.length&&<p className="community-note">No investigations yet. Choose a board above to begin the first conversation.</p>}</section></>:!thread?<><div className="community-section-heading"><div><p className="section-label">INVESTIGATION BOARD</p><h2>{category.title}</h2></div><button className="community-action" onClick={begin}>+ Start Investigation</button></div><div className="community-tools"><div className="community-search-group">{searchOpen&&<input autoFocus aria-label="Search investigations" placeholder="Search investigations" value={query} onChange={e=>{setQuery(e.target.value);setVisible(10)}}/>}<button type="button" className="community-search-toggle" aria-label={searchOpen?"Close search":"Search investigations"} aria-expanded={searchOpen} onClick={()=>{setSearchOpen(v=>!v);setQuery("")}}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/></svg></button></div><select aria-label="Sort investigations" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option></select></div>{filtered.slice(0,visible).map(t=><button className="community-thread-row" key={t.id} onClick={()=>{setThread(t);setWriting(false);setCommentPage(1)}}><strong>{t.title}</strong><span>Opening evidence by {author(t.author_id)} · {new Date(t.created_at).toLocaleDateString()}</span></button>)}{!filtered.length&&<p>No investigations found. Start the conversation.</p>}{filtered.length>visible&&<button className="community-action" onClick={()=>setVisible(v=>v+10)}>Load More</button>}</>:<><button className="community-back" onClick={()=>{setThread(null);setWriting(false)}}>← Back to Discussions</button><article className="community-evidence"><p className="section-label">OPENING EVIDENCE</p><h2>{thread.title}</h2><small>{author(thread.author_id)} · {new Date(thread.created_at).toLocaleString()}</small><p className="community-content">{thread.body}</p></article><h3>Evidence Contributions ({comments.length})</h3>{comments.slice((commentPage-1)*25,commentPage*25).map(c=><article className="community-evidence" key={c.id}><small>{author(c.author_id)} · {new Date(c.created_at).toLocaleString()}</small><p className="community-content">{c.body}</p><button className="community-back" onClick={()=>{setBody("“"+c.body.slice(0,350)+"”\n\n");begin()}}>Quote Evidence</button></article>)}{comments.length>25&&<div className="community-pagination">{Array.from({length:Math.ceil(comments.length/25)},(_,i)=><button key={i} disabled={commentPage===i+1} onClick={()=>setCommentPage(i+1)}>{i+1}</button>)}</div>}{!thread.is_locked&&<button className="community-action" onClick={begin}>+ Add Evidence</button>}</>}
   {writing&&<form className="community-compose" onSubmit={publish}>{error&&<p className="community-form-error" role="alert">{error}</p>}{notice&&<p className="community-note" role="status">{notice}</p>}<h3>{thread?"Add Evidence":"Start Investigation"}</h3>{!thread&&<label>Investigation title<input required minLength={5} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>}<label>{thread?"Evidence Contribution":"Opening Evidence"}<textarea required minLength={thread?2:10} maxLength={thread?2000:5000} rows={8} value={body} onChange={e=>setBody(e.target.value)}/><small>{body.length} / {thread?2000:5000} characters</small></label>{preview&&<article className="community-evidence"><h3>{title}</h3><p className="community-content">{body}</p></article>}<div className="community-actions"><button type="button" onClick={()=>setPreview(v=>!v)}>{preview?"Hide Preview":"Preview"}</button><button className="community-action" disabled={busy}>{busy?"Publishing…":"Publish"}</button><button type="button" onClick={()=>setWriting(false)}>Cancel</button></div></form>}
   {guidelines&&<div className="community-modal" role="dialog" aria-modal="true" aria-label="Community Guidelines"><div><h2>Community Guidelines v1.0</h2><p>{RULES}</p><label><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I have read and agree to these guidelines.</label><div className="community-actions"><button className="community-action" disabled={!checked||busy} onClick={agree}>Accept Guidelines</button><button onClick={()=>setGuidelines(false)}>Cancel</button></div></div></div>}
  </section><footer className="community-footer"><Link href="/">← RETURN TO THE SHOW</Link><span>OBSERVE. COMPARE. DISCERN. AND UNDERSTAND.</span></footer>
 </main>;
}