"use client";
import {useEffect,useState} from "react";
import {createClient} from "@supabase/supabase-js";
let client;
function db(){if(!client)client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);return client}
export default function ReplyComposer({initial="",target=null,onSubmit,onCancel,busy}){
 const [value,setValue]=useState(initial),[suggestions,setSuggestions]=useState([]),[active,setActive]=useState(0),[mentions,setMentions]=useState([]);
 useEffect(()=>{
  if(!initial.startsWith("@"))return;
  let alive=true;
  const username=initial.slice(1).trim();
  db().from("investigator_profiles").select("user_id,display_name").eq("display_name",username).limit(1).then(({data})=>{if(alive&&data?.[0])setMentions(v=>[...v,data[0]])});
  return()=>{alive=false};
 },[initial]);
 const match=value.match(/(?:^|\s)@([a-zA-Z0-9_]{0,40})$/);
 useEffect(()=>{
  if(!match){setSuggestions([]);return}
  let cancelled=false;
  const timer=setTimeout(async()=>{
   const {data,error}=await db().from("investigator_profiles").select("user_id,display_name").ilike("display_name",match[1]+"%").limit(5);
   if(!cancelled)setSuggestions(error?[]:(data||[]));
  },200);
  return()=>{cancelled=true;clearTimeout(timer)}
 },[value]);
 function choose(person){
  const next=value.replace(/(^|\s)@[a-zA-Z0-9_]*$/,(_,space)=>space+"@"+person.display_name+" ");
  setValue(next);setMentions(v=>[...v.filter(x=>x.user_id!==person.user_id),person]);setSuggestions([]);setActive(0);
 }
 function keyDown(e){
  if(!suggestions.length)return;
  if(e.key==="ArrowDown"){e.preventDefault();setActive(v=>(v+1)%suggestions.length)}
  if(e.key==="ArrowUp"){e.preventDefault();setActive(v=>(v+suggestions.length-1)%suggestions.length)}
  if(e.key==="Escape"){e.preventDefault();setSuggestions([])}
  if(e.key==="Enter"){e.preventDefault();choose(suggestions[active]||suggestions[0])}
 }
 async function submit(e){
  e.preventDefault();
  const ids=mentions.filter(p=>value.toLowerCase().split(/[^a-z0-9_@]+/).includes("@"+p.display_name.toLowerCase())).map(p=>p.user_id);
  await onSubmit(value,ids);
 }
 return <form className="community-inline-form community-thread-composer" onSubmit={submit}>
  {target&&<div className="community-replying-to">↳ Replying to {target}</div>}
  <div className="community-mention-wrapper">
   <textarea autoFocus required minLength={2} maxLength={2000} rows={3} placeholder="Write a reply or share a source… Use @ to mention an Investigator." value={value} onChange={e=>setValue(e.target.value)} onKeyDown={keyDown}/>
   {suggestions.length>0&&<div className="community-mention-suggestions" role="listbox" aria-label="Investigator usernames">{suggestions.map((p,i)=><button type="button" role="option" aria-selected={i===active} key={p.user_id} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(p)}>{p.display_name}</button>)}</div>}
  </div>
  <div><button type="button" onClick={onCancel}>Cancel</button><button className="community-action" disabled={busy}>{busy?"Posting…":"Post Reply"}</button></div>
 </form>;
}