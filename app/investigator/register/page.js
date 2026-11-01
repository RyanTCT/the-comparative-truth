"use client";
import {useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";

let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 return browserSupabase;
}

export default function InvestigatorRegistration(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState(false);
 async function submit(e){
  e.preventDefault();setError("");
  if(password.length<8){setError("Please use a password with at least 8 characters.");return}
  if(password!==confirm){setError("Passwords do not match.");return}
  setBusy(true);
  try{
   const {data,error:signUpError}=await getSupabase().auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+"/investigator/login"}});
   if(signUpError)throw signUpError;
   if(!data?.user)throw new Error("Registration could not be completed. Please try again.");
   setSuccess(true);setPassword("");setConfirm("");
  }catch(err){setError(err.message||"Unable to create account. Please try again.")}
  finally{setBusy(false)}
 }
 return <main className="investigator-auth-page"><Link className="investigator-back" href="/">← The Comparative Truth</Link><section className="investigator-auth-card">
 <p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>Become an <em>Investigator.</em></h1>
 {success?<div role="status" className="investigator-auth-success"><h2>Check your inbox.</h2><p>If your email is eligible for registration, a verification message will arrive at <strong>{email.trim()}</strong>. Follow its link to confirm your account before voting.</p><p>Already verified? <Link href="/investigator/login">Investigator Login →</Link></p></div>:<>
 <p className="investigator-auth-description">Join the conversation. Examine the evidence. Weigh in on the questions behind each episode. Membership is free.</p>
 <form onSubmit={submit} className="investigator-auth-form">
 <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label>Password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
 <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter your password"/></label>
 {error&&<p role="alert" className="investigator-auth-error">{error}</p>}
 <button type="submit" disabled={busy}>{busy?"Creating account…":"Become an Investigator →"}</button>
 </form><p className="investigator-auth-foot">Already an Investigator? <Link href="/investigator/login">Sign in</Link></p><p className="investigator-auth-small">Email verification is required before participating in Weigh In voting.</p>
 </>}
 </section></main>;
}
