"use client";
import {useEffect,useMemo,useState} from "react";
const LIMIT=5;
export default function InvestigatorDirectory({session}){
 const [weighExpanded,setWeighExpanded]=useState(false),[data,setData]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[search,setSearch]=useState(""),[selected,setSelected]=useState(null),[activityFilter,setActivityFilter]=useState("All"),[moderationFilter,setModerationFilter]=useState("All"),[activityExpanded,setActivityExpanded]=useState(false),[moderationExpanded,setModerationExpanded]=useState(false);
 async function load(){
  if(!session?.access_token)return;
  setBusy(true);setError("");
  try{const r=await fetch("/api/admin/investigators",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load Investigator directory.");setData(d)}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 useEffect(()=>{load()},[session?.access_token]);
 const matches=useMemo(()=>search.trim()?[...(data?.profiles||[])].filter(p=>(p.display_name||"").toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>(a.display_name||"").localeCompare(b.display_name||"")):[],[data,search]);
 const profiles=matches.slice(0,10);
 const current=data?.profiles?.find(p=>p.user_id===selected);
 const threads=(data?.threads||[]).filter(t=>t.author_id===selected);
 const comments=(data?.comments||[]).filter(c=>c.author_id===selected);
 const threadById=Object.fromEntries((data?.threads||[]).map(t=>[t.id,t]));
 const activity=[...threads.map(t=>({...t,kind:"Investigation",thread_id:t.id})),...comments.map(c=>({...c,kind:"Contribution"}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const weigh=(data?.weighVotes||[]).filter(v=>v.user_id===selected).map(v=>({...v,question:(data?.weighQuestions||[]).find(q=>q.id===v.question_id),option:(data?.weighOptions||[]).find(o=>o.id===v.option_id)})).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const moderation=(data?.moderation||[]).filter(x=>x.author_id===selected).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const given=(data?.commentLikes||[]).filter(x=>x.user_id===selected).length+(data?.threadLikes||[]).filter(x=>x.user_id===selected).length;
 const commentIds=new Set(comments.map(x=>x.id)),threadIds=new Set(threads.map(x=>x.id));
 const received=(data?.commentLikes||[]).filter(x=>commentIds.has(x.comment_id)).length+(data?.threadLikes||[]).filter(x=>threadIds.has(x.thread_id)).length;
 const filteredActivity=activity.filter(a=>activityFilter==="All"||a.kind===activityFilter);
 const filteredModeration=moderation.filter(a=>moderationFilter==="All"||a.status===moderationFilter.toLowerCase());
 const recognition=(data?.assignments||[]).filter(a=>a.user_id===selected).map(a=>data.titles?.find(t=>t.id===a.title_id)?.name).filter(Boolean);
 async function setModerator(user_id,moderator){
  if(!window.confirm((moderator?"Grant":"Remove")+" moderator access for this Investigator?"))return;
  setBusy(true);setError("");
  try{const r=await fetch("/api/admin/investigators",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({user_id,moderator})});const d=await r.json();if(!r.ok)throw Error(d.error||"Role update failed");await load()}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 const switchUser=id=>{setSelected(id);setActivityExpanded(false);setWeighExpanded(false);setModerationExpanded(false);setActivityFilter("All");setModerationFilter("All")};
 const tabs=(values,active,setter)=><div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"12px 0 18px"}}>{values.map(v=><button type="button" key={v} onClick={()=>setter(v)} aria-pressed={active===v} style={{border:"1px solid #655037",padding:"8px 12px",background:active===v?"#916332":"#252322",color:"#eee8df",cursor:"pointer"}}>{v}</button>)}</div>;
 const panelStyle={minWidth:0,border:"1px solid #51402f",background:"#141517",padding:20};
 return <section className="admin-overview-panel">
  <h3>Investigator Directory</h3><p>Search registered Investigators, review community activity, Weigh In votes, and moderation records, and manage moderator assignments.</p>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end",marginBottom:18}}>
   <label style={{flex:"1 1 230px"}}>Search Investigators<input type="search" value={search} onChange={e=>{setSearch(e.target.value);switchUser(null)}} placeholder="Search by display name" style={{width:"100%",padding:10,marginTop:6}}/></label>
   <button type="button" className="admin-section-action" disabled={busy} onClick={load}>{busy?"Loading…":"Refresh directory ↻"}</button>
  </div>
  {data&&(search.trim()?<p>Showing {profiles.length} of {matches.length} matching Investigators{matches.length>10?" (refine your search for more)":""}.</p>:<p>Search for an Investigator by username.</p>)}
  {data&&!data.moderatorRolesReady&&<p className="admin-error">Moderator assignments are unavailable until the role SQL is applied.</p>}
  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>{profiles.map(p=>{const admin=data.admins.includes(p.user_id),mod=data.moderators.includes(p.user_id);return <button key={p.user_id} type="button" className="admin-section-action" style={{textAlign:"left",borderColor:selected===p.user_id?"#d6a34a":undefined}} onClick={()=>switchUser(p.user_id)}>{p.display_name||"Investigator"} <small>· {admin?"Administrator":mod?"Moderator":"Investigator"}</small></button>})}</div>
  {data&&!!search.trim()&&!profiles.length&&<p>No Investigators match that search.</p>}
  {current&&<div style={{marginTop:22}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:18,flexWrap:"wrap",alignItems:"center"}}>
    <div><h3 style={{margin:"0 0 8px"}}>{current.display_name||"Investigator"}</h3><p style={{margin:0}}>Role: {data.admins.includes(selected)?"Administrator":data.moderators.includes(selected)?"Moderator":"Investigator"}{recognition.length?" · "+recognition.join(", "):""}</p>{current.created_at&&<p style={{margin:"7px 0 0",color:"#bfb2a0",fontSize:14}}>Member since {new Date(current.created_at).toLocaleDateString(undefined,{month:"long",year:"numeric"})}</p>}</div>
    {data.moderatorRolesReady&&!data.admins.includes(selected)&&<button type="button" className="admin-section-action" disabled={busy} onClick={()=>setModerator(selected,!data.moderators.includes(selected))}>{data.moderators.includes(selected)?"Remove Moderator Role":"Grant Moderator Role"}</button>}
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12,margin:"22px 0"}}>
    {[["Investigations",threads.length],["Contributions",comments.length],["Likes Received",received],["Likes Given",given],["Polls Participated In",weigh.length]].map(([label,value])=><div key={label} style={{border:"1px solid #57442f",padding:"14px 16px",textAlign:"center"}}><strong style={{display:"block",fontSize:25,color:"#d6a34a"}}>{value}</strong><span>{label}</span></div>)}
   </div>
   {data.activityLimited&&<p style={{fontSize:13,color:"#bfb2a0"}}>Activity totals reflect the most recent records available.</p>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))",gap:18,alignItems:"start"}}>
    <div style={panelStyle}><h4 style={{marginTop:0,fontSize:20}}>Community Activity</h4>
     {tabs(["All","Investigation","Contribution"],activityFilter,v=>{setActivityFilter(v);setActivityExpanded(false)})}
     {filteredActivity.slice(0,activityExpanded?undefined:LIMIT).map(a=><div className="admin-analytics-row" key={a.kind+a.id} style={{display:"block",padding:"12px 0"}}>
      <strong>{a.kind}</strong> · <time>{new Date(a.created_at).toLocaleString()}</time><br/>
      <a href={"/community?thread="+encodeURIComponent(a.thread_id)} style={{color:"#d6a34a"}}>{a.kind==="Investigation"?a.title:(threadById[a.thread_id]?.title||"View discussion")} ↗</a>
     </div>)}
     {!filteredActivity.length&&<p>No matching community activity.</p>}
     {filteredActivity.length>LIMIT&&<button type="button" className="admin-section-action" style={{marginTop:16}} onClick={()=>setActivityExpanded(x=>!x)}>{activityExpanded?"Show Less":"View More ("+(filteredActivity.length-LIMIT)+")"}</button>}
    </div>
    <div style={panelStyle}><h4 style={{marginTop:0,fontSize:20}}>Weigh In Activity</h4>
     <p style={{fontSize:13,color:"#bfb2a0"}}>Current votes for episode questions.</p>
     {weigh.slice(0,weighExpanded?undefined:LIMIT).map(v=><div className="admin-analytics-row" key={v.question_id} style={{display:"block",padding:"12px 0"}}>
      <strong>Episode {String(v.question?.episode_number||"?").padStart(2,"0")}</strong> · <time>{new Date(v.created_at).toLocaleString()}</time>
      <div style={{margin:"7px 0",overflowWrap:"anywhere"}}>{v.question?.question||"Episode question unavailable"}</div>
      <div style={{overflowWrap:"anywhere"}}><span style={{color:"#d6a34a"}}>Voted:</span> <span style={{color:"#bfb2a0"}}>{v.option?.option_text||"Answer unavailable"}</span></div>
     </div>)}
     {!weigh.length&&<p>No Weigh In votes yet.</p>}
     {weigh.length>LIMIT&&<button type="button" className="admin-section-action" style={{marginTop:16}} onClick={()=>setWeighExpanded(x=>!x)}>{weighExpanded?"Show Less":"View More ("+(weigh.length-LIMIT)+")"}</button>}
    </div>
   </div>
   <div style={{...panelStyle,marginTop:18}}><h4 style={{marginTop:0,fontSize:20}}>Moderation Record</h4>

     <p style={{fontSize:13,color:"#bfb2a0"}}>Automated flags are not confirmed violations.</p>
     {tabs(["All","Pending","Approved","Rejected"],moderationFilter,v=>{setModerationFilter(v);setModerationExpanded(false)})}
     {filteredModeration.slice(0,moderationExpanded?undefined:LIMIT).map(m=><div className="admin-analytics-row" key={m.id} style={{display:"block",padding:"12px 0"}}>
      <strong style={{textTransform:"capitalize"}}>{m.status}</strong> · <span>{m.submission_type.replaceAll("_"," ")}</span> · <time>{new Date(m.created_at).toLocaleString()}</time>
      {m.review_note&&<p style={{margin:"7px 0",overflowWrap:"anywhere"}}>Reason: {m.review_note}</p>}
      {m.reviewed_at&&<small style={{display:"block",marginTop:8}}>Reviewed: {new Date(m.reviewed_at).toLocaleString()}</small>}
     </div>)}
     {!filteredModeration.length&&<p>No matching moderation records.</p>}
     {filteredModeration.length>LIMIT&&<button type="button" className="admin-section-action" style={{marginTop:16}} onClick={()=>setModerationExpanded(x=>!x)}>{moderationExpanded?"Show Less":"View More ("+(filteredModeration.length-LIMIT)+")"}</button>}
    </div>
  </div>}
 </section>;
}
