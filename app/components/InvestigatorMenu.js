"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@supabase/supabase-js";

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});

export default function InvestigatorMenu(){
 const [open,setOpen]=useState(false);
 const [user,setUser]=useState(null);
 const root=useRef(null);
 useEffect(()=>{
  let active=true;
  supabase.auth.getUser().then(({data})=>{if(active)setUser(data?.user||null)}).catch(()=>{if(active)setUser(null)});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(active)setUser(session?.user||null)});
  const close=e=>{if(root.current&&!root.current.contains(e.target))setOpen(false)};
  const esc=e=>{if(e.key==="Escape")setOpen(false)};
  document.addEventListener("pointerdown",close);
  document.addEventListener("keydown",esc);
  return()=>{active=false;subscription.unsubscribe();document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc)};
 },[]);
 async function signOut(){setOpen(false);const {error}=await supabase.auth.signOut();if(!error){setUser(null);window.location.assign("/");}}
 const initial=user?.email?.trim()?.charAt(0)?.toUpperCase();
 return <div className="investigator-menu" ref={root}>
  <button type="button" className="investigator-trigger" aria-label="Investigator account menu" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   {initial?<span className="investigator-initial" aria-hidden="true">{initial}</span>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>}
  </button>
  {open&&<div className="investigator-dropdown" role="menu"><span className="investigator-dropdown-label">{user?"INVESTIGATOR ACCOUNT":"INVESTIGATOR ACCESS"}</span>
   {user?<><button type="button" role="menuitem" className="investigator-dropdown-action" onClick={signOut}>Sign Out</button></>:<><a role="menuitem" href="/investigator/register">Become an Investigator</a><a role="menuitem" href="/investigator/login">Investigator Login</a></>}
  </div>}
 </div>;
}
