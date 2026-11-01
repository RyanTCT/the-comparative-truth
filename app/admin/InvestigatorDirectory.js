"use client";
import {useEffect,useMemo,useState} from "react";
export default function InvestigatorDirectory({session}){
 const [data,setData]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[search,setSearch]=useState(""),[selected,setSelected]=useState(null);
 async function load(){
  if(!session?.access_token)return;
  setBusy(true);setError("");
  try{const r=await fetch("/api/admin/investigators",{headers:{Authorization:"Bearer "+session.access_token},cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"Unable to load Investigator directory.");setData(d)}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 useEffect(()=>{load()},[session?.access_token]);
 const profiles=useMemo(()=>[...(data?.profiles||[])].filter(p=>(p.display_name||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>(a.display_name||"").localeCompare(b.display_name||"")),[data,search]);
 const current=data?.profiles?.find(p=>p.user_id===selected);
 const threads=(data?.threads||[]).filter(t=>t.author_id===selected);
 const comments=(data?.comments||[]).filter(c=>c.author_id===selected);
 const threadById=Object.fromEntries((data?.threads||[]).map(t=>[t.id,t]));
 const activity=[...threads.map(t=>({...t,kind:"Investigation",thread_id:t.id})),...comments.map(c=>({...c,kind:"Evidence contribution"}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 async function setModerator(user_id,moderator){
  if(!window.confirm((moderator?"Grant":"Remove")+" moderator access for this Investigator?"))return;
  setBusy(true);setError("");
  try{const r=await fetch("/api/admin/investigators",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({user_id,moderator})});const d=await r.json();if(!r.ok)throw Error(d.error||"Role update failed");await load()}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <section className="admin-overview-panel">
  <h3>Investigator Directory</h3><p>Search registered Investigators, review contributions, and manage moderator assignments. Engagement badges and recognition titles are separate from permissions.</p>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end",marginBottom:18}}>
   <label style={{flex:"1 1 230px"}}>Search Investigators<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by display name" style={{width:"100%",padding:10,marginTop:6}}/></label>
   <button type="button" className="admin-section-action" disabled={busy} onClick={load}>{busy?"Loading…":"Refresh directory ↻"}</button>
  </div>
  {data&&<p>{profiles.length} of {data.profiles.length} Investigators shown</p>}
  {data&&!data.moderatorRolesReady&&<p className="admin-error">Moderator assignments are unavailable until the Batch 2 role SQL is applied. The directory remains read-only for roles.</p>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
   <div style={{maxHeight:460,overflowY:"auto"}}>
    {profiles.map(p=>{const admin=data.admins.includes(p.user_id),mod=data.moderators.includes(p.user_id);return <button key={p.user_id} type="button" className="admin-section-action" style={{display:"block",width:"100%",textAlign:"left",marginBottom:8,borderColor:selected===p.user_id?"#d6a34a":undefined}} onClick={()=>setSelected(p.user_id)}>{p.display_name||"Investigator"} <small>· {admin?"Administrator":mod?"Moderator":"Investigator"}</small></button>})}
    {data&&!profiles.length&&<p>No Investigators match that search.</p>}
   </div>
   <div>
    {!current?<p>Select an Investigator to view their activity.</p>:<>
     <h3>{current.display_name||"Investigator"}</h3>
     <p>{threads.length} investigations · {comments.length} evidence contributions{data.activityLimited?" (recent activity only)":""}</p>
     <p><strong>Role:</strong> {data.admins.includes(selected)?"Administrator":data.moderators.includes(selected)?"Moderator":"Investigator"}</p>
     {data.moderatorRolesReady&&!data.admins.includes(selected)&&<button type="button" className="admin-section-action" disabled={busy} onClick={()=>setModerator(selected,!data.moderators.includes(selected))}>{data.moderators.includes(selected)?"Remove Moderator Role":"Grant Moderator Role"}</button>}
     <h4 style={{marginTop:20}}>Recent Activity</h4>
     <div style={{maxHeight:400,overflowY:"auto"}}>
      {activity.slice(0,100).map(a=><div className="admin-analytics-row" key={a.kind+a.id} style={{display:"block",padding:"10px 0"}}>
       <strong>{a.kind}</strong> · <time>{new Date(a.created_at).toLocaleString()}</time><br/>
       <a href={"/community?thread="+encodeURIComponent(a.thread_id)} style={{color:"#d6a34a"}}>{a.kind==="Investigation"?a.title:(threadById[a.thread_id]?.title||"View discussion")} ↗</a>
      </div>)}
      {!activity.length&&<p>No recorded community activity.</p>}
     </div>
    </>}
   </div>
  </div>
 </section>
}
