"use client";
import {useEffect,useRef,useState} from "react";
export default function InvestigatorMenu(){
 const [open,setOpen]=useState(false);
 const root=useRef(null);
 useEffect(()=>{const close=e=>{if(root.current&&!root.current.contains(e.target))setOpen(false)};const esc=e=>{if(e.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",close);document.addEventListener("keydown",esc);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc)}},[]);
 return <div className="investigator-menu" ref={root}>
  <button type="button" className="investigator-trigger" aria-label="Investigator account menu" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/></svg>
  </button>
  {open&&<div className="investigator-dropdown" role="menu"><span className="investigator-dropdown-label">INVESTIGATOR ACCESS</span><a role="menuitem" href="/investigator/register">Become an Investigator</a><a role="menuitem" href="/investigator/login">Investigator Login</a></div>}
 </div>
}
