"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@supabase/supabase-js";

let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 return browserSupabase;
}

export default function InvestigatorMenu(){
 const [open,setOpen]=useState(false);
 const [user,setUser]=useState(null);
 const [displayName,setDisplayName]=useState(null);
 const [isAdmin,setIsAdmin]=useState(false);
 const root=useRef(null);
 useEffect(()=>{
  let active=true;
  getSupabase().auth.getUser().then(({data})=>{if(active)setUser(data?.user||null)}).catch(()=>{if(active)setUser(null)});
  const {data:{subscription}}=getSupabase().auth.onAuthStateChange((_event,session)=>{if(active)setUser(session?.user||null)});
  const close=e=>{if(root.current&&!root.current.contains(e.target))setOpen(false)};
  const esc=e=>{if(e.key==="Escape")setOpen(false)};
  document.addEventListener("pointerdown",close);
  document.addEventListener("keydown",esc);
  return()=>{active=false;subscription.unsubscribe();document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc)};
 },[]);
 useEffect(()=>{
  let active=true;
  if(!user?.id){setDisplayName(null);setIsAdmin(false);return;}
  async function loadName(){
   const {data,error}=await getSupabase().from("investigator_profiles").select("display_name").eq("user_id",user.id).maybeSingle();
   if(active)setDisplayName(error?null:(data?.display_name||null));
  }
  loadName();
  getSupabase().auth.getSession().then(async ({data})=>{if(!data.session?.access_token)return;try{const r=await fetch("/api/community/admin",{headers:{Authorization:"Bearer "+data.session.access_token}});if(active)setIsAdmin(r.ok)}catch{if(active)setIsAdmin(false)}});
  const refresh=()=>loadName();
  window.addEventListener("focus",refresh);
  document.addEventListener("visibilitychange",refresh);
  return()=>{active=false;window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[user?.id]);
 async function signOut(){setOpen(false);const {error}=await getSupabase().auth.signOut();if(!error){setUser(null);window.location.assign("/");}}
 const initial=(displayName||user?.email)?.trim()?.charAt(0)?.toUpperCase();
 return <div className="investigator-menu" ref={root}>
  <button type="button" className="investigator-trigger" aria-label="Investigator account menu" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   {initial?<span className="investigator-initial" aria-hidden="true">{initial}</span>:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>}
  </button>
  {open&&<div className="investigator-dropdown" role="menu"><span className="investigator-dropdown-label">{user?<><span>INVESTIGATOR: </span><span className="investigator-dropdown-username">{displayName||"SET UP PROFILE"}</span></>:"INVESTIGATOR ACCESS"}</span>
   {user?<><a role="menuitem" href="/investigator/profile">My Investigator Profile</a>{isAdmin&&<a role="menuitem" href="/admin?section=community">Investigation Desk</a>}<button type="button" role="menuitem" className="investigator-dropdown-action" onClick={signOut}>Sign Out</button></>:<><a role="menuitem" href="/investigator/register">Become an Investigator</a><a role="menuitem" href="/investigator/login">Investigator Login</a></>}
  </div>}
 </div>;
}
