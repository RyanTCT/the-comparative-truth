"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
import "./CommunityModeration.css";
let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
 return browserSupabase;
}
export default function CommunityModeration(){
 const [data,setData]=useState(null),[dialog,setDialog]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[tab,setTab]=useState("pending"),[query,setQuery]=useState("");
 async function request(payload){
  const {data:{session}}=await getSupabase().auth.getSession();
  if(!session?.access_token)throw Error("Sign in to your Investigator account first.");
  const r=await fetch("/api/community/admin",{method:payload?"POST":"GET",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},...(payload?{body:JSON.stringify(payload)}:{})});
  const value=await r.json();if(!r.ok)throw Error(value.error||"Request failed");return value;
 }
 async function refresh(){try{setData(await request());setError("")}catch(e){setError(e.message)}}
 useEffect(()=>{refresh()},[]);
 async function act(action,id,category_id){

  if(["hide_thread","hide_comment"].includes(action)&&!window.confirm("Hide this contribution from the Community?"))return;
  setBusy(true);setError("");
  try{await request({action,id,...(category_id?{category_id}:{})});setDialog(null);await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 const categories=data?.categories||[];
 const pending=data?.pending||[];
 const selectedCase=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("case"):null;
 const categoryName=id=>categories.find(c=>c.id===id)?.title||"Unknown board";
 const threads=(data?.threads||[]).filter(t=>[t.title,t.body].join(" ").toLowerCase().includes(query.toLowerCase()));
 const comments=(data?.comments||[]).filter(c=>c.body.toLowerCase().includes(query.toLowerCase()));
 return <section className="community-moderation"><p className="section-label">THE COMPARATIVE TRUTH / PRIVATE ADMINISTRATION</p><h1>Community Moderation</h1><p>Manage investigations, evidence, and moderation history. Changes are logged.</p>{error&&<p role="alert" className="admin-error">{error}</p>}{!data?<p>Administrator authorization required to load this dashboard.</p>:<><div className="admin-stats"><span>{pending.length} pending review</span><span>{data.threads.length} investigations</span><span>{data.comments.length} contributions</span><span>{data.threads.filter(t=>t.is_hidden).length+data.comments.filter(c=>c.is_hidden).length} hidden items</span></div><div className="admin-tabs">{[["pending","Pending Review"],["threads","Investigations"],["comments","Evidence"],["history","History"]].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div>{tab!=="history"&&tab!=="pending"&&<input className="admin-search" aria-label="Search content" placeholder="Search content" value={query} onChange={e=>setQuery(e.target.value)}/>}
 {tab==="pending"&&(pending.length?pending.map(p=><article className="admin-item" key={p.id} id={"case-"+p.id} style={selectedCase===p.id?{outline:"2px solid #c18b4d"}:{}}><h2>{p.title||"Contribution pending review"}</h2><small>{p.submission_type.replaceAll("_"," ")} · {new Date(p.created_at).toLocaleString()} · Investigator ID: {p.author_id}</small><p style={{whiteSpace:"pre-wrap"}}>{p.body}</p><small>Automated screening categories: {Object.entries(p.moderation_categories||{}).filter(([,v])=>v).map(([k])=>k).join(", ")||"Flagged"}</small><div className="admin-actions"><button disabled={busy||p.author_id===data.viewerId} onClick={()=>setDialog({action:"approve_pending",id:p.id})}>Approve &amp; Publish</button><button disabled={busy||p.author_id===data.viewerId} onClick={()=>setDialog({action:"reject_pending",id:p.id})}>Reject</button></div></article>):<p>No contributions awaiting review.</p>)}
 {data.isAdmin&&tab==="threads"&&threads.map(t=><article className="admin-item" key={t.id}><h2>{t.is_pinned?"📌 ":""}{t.title}</h2><small>{categoryName(t.category_id)} · {new Date(t.created_at).toLocaleString()} · {t.is_hidden?"Hidden":"Visible"} · {t.is_locked?"Locked":"Open"}</small><p>{t.body}</p><div className="admin-actions"><button disabled={busy} onClick={()=>act(t.is_pinned?"unpin":"pin",t.id)}>{t.is_pinned?"Unpin":"Pin"}</button><button disabled={busy} onClick={()=>act(t.is_locked?"unlock":"lock",t.id)}>{t.is_locked?"Unlock":"Lock"}</button><button disabled={busy} onClick={()=>act(t.is_hidden?"restore_thread":"hide_thread",t.id)}>{t.is_hidden?"Restore":"Hide"}</button><label>Move to <select disabled={busy} value={t.category_id} onChange={e=>act("move",t.id,e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div></article>)}
 {data.isAdmin&&tab==="comments"&&comments.map(c=><article className="admin-item" key={c.id}><small>{new Date(c.created_at).toLocaleString()} · {c.is_hidden?"Hidden":"Visible"}</small><p>{c.body}</p><div className="admin-actions"><button disabled={busy} onClick={()=>act(c.is_hidden?"restore_comment":"hide_comment",c.id)}>{c.is_hidden?"Restore":"Hide"}</button></div></article>)}
 {data.isAdmin&&tab==="history"&&(data.history.length?data.history.map(h=><article className="admin-item" key={h.id}><strong>{h.action.replaceAll("_"," ")}</strong><small> · {h.target_type} · {new Date(h.created_at).toLocaleString()}</small><p>{h.detail||h.target_id}</p></article>):<p>No moderation actions recorded.</p>)}
 </>}{dialog&&<div className="moderation-dialog-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><div className="moderation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="moderation-dialog-title"><p className="section-label">THE COMPARATIVE TRUTH / MODERATION</p><h2 id="moderation-dialog-title">{dialog.action==="approve_pending"?"Approve contribution?":"Reject contribution?"}</h2><p>{dialog.action==="approve_pending"?"This contribution will be published to the Community Board.":"This contribution will remain unpublished, and the Investigator will be notified."}</p><div className="moderation-dialog-actions"><button type="button" disabled={busy} onClick={()=>setDialog(null)}>Cancel</button><button type="button" disabled={busy} onClick={()=>act(dialog.action,dialog.id)}>{busy?"Processing…":dialog.action==="approve_pending"?"Approve & Publish":"Reject Contribution"}</button></div></div></div>}</section>;
}
