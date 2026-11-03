"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import InvestigatorMenu from "./InvestigatorMenu";
import NotificationBell from "./NotificationBell";
export default function SiteHeader(){
 const [open,setOpen]=useState(false);const menu=useRef(null);
 useEffect(()=>{const close=e=>{if(menu.current&&!menu.current.contains(e.target))setOpen(false)};const esc=e=>{if(e.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",close);document.addEventListener("keydown",esc);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc)}},[]);
 const links=[["/","Home"],["/#episodes","Episodes"],["/#research","Research Library"],["/community","Community Board"],["/weigh-in","Weigh In"],["/#about","About"],["/join-the-show","Join the Show"]];
 return <nav className="navbar" aria-label="Main navigation"><Link href="/" className="nav-brand">THE COMPARATIVE TRUTH</Link><div className="nav-links">{links.slice(1).filter(([href])=>href!=="/weigh-in").map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</div><div className="site-header-controls" ref={menu}><NotificationBell/><button className="mobile-nav-toggle" type="button" aria-label="Toggle site navigation" aria-expanded={open} aria-controls="mobile-site-navigation" onClick={()=>setOpen(v=>!v)}><span/><span/><span/></button><InvestigatorMenu/>{open&&<div id="mobile-site-navigation" className="mobile-site-navigation">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</div>}</div></nav>;
}