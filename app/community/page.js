"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export default function Community(){
 const [categories,setCategories]=useState([]);
 const [threads,setThreads]=useState([]);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  async function load(){
   const [cat,posts]=await Promise.all([
    supabase.from("community_categories").select("id,slug,title,description,sort_order").order("sort_order"),
    supabase.from("community_threads").select("id,category_id,title,created_at").order("created_at",{ascending:false}).limit(30)
   ]);
   if(!active)return;
   if(cat.error||posts.error)setError("Community discussions are temporarily unavailable. Please try again later.");
   else {setCategories(cat.data||[]);setThreads(posts.data||[]);}
   setLoading(false);
  }
  load();return()=>{active=false};
 },[]);
 return <main className="community-page">
  <header className="community-top"><Link href="/">← THE COMPARATIVE TRUTH</Link><Link href="/investigator/profile">INVESTIGATOR PROFILE →</Link></header>
  <section className="community-hero"><p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>The Investigation <em>Continues.</em></h1>
   <p>Examine the evidence. Challenge assumptions. Share perspectives. The conversation doesn't end when the episode does.</p>
   <div className="community-principle">CHALLENGE THE ARGUMENT. RESPECT THE INDIVIDUAL.</div>
  </section>
  <section className="community-body"><div className="community-section-heading"><div><p className="section-label">DISCUSSION BOARDS</p><h2>Choose an Investigation</h2></div><span>Public to read • Investigator account required to participate</span></div>
   {loading&&<p>Loading discussion boards…</p>}
   {error&&<p role="alert" className="investigator-auth-error">{error}</p>}
   <div className="community-grid">{categories.map((category,index)=>{
    const count=threads.filter(t=>t.category_id===category.id).length;
    return <section className="community-card" key={category.id}><span className="community-card-number">0{index+1} / INVESTIGATION BOARD</span><h3>{category.title}</h3><p>{category.description}</p><div className="community-card-bottom"><span>{count===0?"No discussions yet":count+" recent discussion"+(count===1?"":"s")}</span><span>COMING SOON →</span></div></section>;
   })}</div>
   {!loading&&!error&&<p className="community-note">We're preparing the first discussions. Soon, verified Investigators will be able to start threads, reply, and share sources.</p>}
  </section>
  <footer className="community-footer"><Link href="/">← RETURN TO THE SHOW</Link><span>OBSERVE. COMPARE. DISCERN. AND UNDERSTAND.</span></footer>
 </main>;
}
