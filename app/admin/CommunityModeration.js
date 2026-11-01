"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import "./CommunityModeration.css";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export default function CommunityModeration(){
 const [data,setData]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[tab,setTab]=useState("threads"),[query,setQuery]=useState("");
 async function request(payload){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw Error("Sign in to your Investigator account first.");
  const r=await fetch("/api/community/admin",{method:payload?"POST":"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},...(payload?{body:JSON.stringify(payload)}:{})});
  const value=await r.json();if(!r.ok)throw Error(value.error||"Request failed");return value;
 }
 async function refresh(){try{setData(await request());setError("")}catch(e){setError(e.message)}}
 useEffect(()=>{refresh()},[]);
 async function act(action,id,category_id){
  if(["hide_thread","hide_comment"].includes(action)&&!window.confirm("Hide this contribution from the Community?"))return;
  setBusy(true);setError("");
  try{await request({action,id,...(category_id?{category_id}:{})});await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 const categories=data?.categories||[];
 const categoryName=id=>categories.find(c=>c.id===id)?.title||"Unknown board";
 const threads=(data?.threads||[]).filter(t=>[t.title,t.body].join(" ").toLowerCase().includes(query.toLowerCase()));
 const comments=(data?.comments||[]).filter(c=>c.body.toLowerCase().includes(query.toLowerCase()));
 return <section className="community-moderation"><p className="section-label">THE COMPARATIVE TRUTH / PRIVATE ADMINISTRATION</p><h1>Community Moderation</h1><p>Manage investigations, evidence, and moderation history. Changes are logged.</p>{error&&<p role="alert" className="admin-error">{error}</p>}{!data?<p>Administrator authorization required to load this dashboard.</p>:<><div className="admin-stats"><span>{data.threads.length} investigations</span><span>{data.comments.length} contributions</span><span>{data.threads.filter(t=>t.is_hidden).length+data.comments.filter(c=>c.is_hidden).length} hidden items</span></div><div className="admin-tabs">{[["threads","Investigations"],["comments","Evidence"],["history","History"]].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div>{tab!=="history"&&<input className="admin-search" aria-label="Search content" placeholder="Search content" value={query} onChange={e=>setQuery(e.target.value)}/>}
 {tab==="threads"&&threads.map(t=><article className="admin-item" key={t.id}><h2>{t.is_pinned?"📌 ":""}{t.title}</h2><small>{categoryName(t.category_id)} · {new Date(t.created_at).toLocaleString()} · {t.is_hidden?"Hidden":"Visible"} · {t.is_locked?"Locked":"Open"}</small><p>{t.body}</p><div className="admin-actions"><button disabled={busy} onClick={()=>act(t.is_pinned?"unpin":"pin",t.id)}>{t.is_pinned?"Unpin":"Pin"}</button><button disabled={busy} onClick={()=>act(t.is_locked?"unlock":"lock",t.id)}>{t.is_locked?"Unlock":"Lock"}</button><button disabled={busy} onClick={()=>act(t.is_hidden?"restore_thread":"hide_thread",t.id)}>{t.is_hidden?"Restore":"Hide"}</button><label>Move to <select disabled={busy} value={t.category_id} onChange={e=>act("move",t.id,e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div></article>)}
 {tab==="comments"&&comments.map(c=><article className="admin-item" key={c.id}><small>{new Date(c.created_at).toLocaleString()} · {c.is_hidden?"Hidden":"Visible"}</small><p>{c.body}</p><div className="admin-actions"><button disabled={busy} onClick={()=>act(c.is_hidden?"restore_comment":"hide_comment",c.id)}>{c.is_hidden?"Restore":"Hide"}</button></div></article>)}
 {tab==="history"&&(data.history.length?data.history.map(h=><article className="admin-item" key={h.id}><strong>{h.action.replaceAll("_"," ")}</strong><small> · {h.target_type} · {new Date(h.created_at).toLocaleString()}</small><p>{h.detail||h.target_id}</p></article>):<p>No moderation actions recorded.</p>)}
 </>}</section>;
}
