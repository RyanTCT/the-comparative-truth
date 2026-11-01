"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return browserSupabase;
}
export default function ResetPassword(){
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 useEffect(()=>{
  let active=true;
  async function check(){const {data}=await getSupabase().auth.getSession();if(active)setReady(Boolean(data?.session));}
  check();
  const {data:listener}=getSupabase().auth.onAuthStateChange((_event,session)=>{if(active)setReady(Boolean(session));});
  return()=>{active=false;listener.subscription.unsubscribe();};
 },[]);
 async function submit(e){
  e.preventDefault();setError("");
  if(password.length<8){setError("Use at least 8 characters.");return;}
  if(password!==confirm){setError("Passwords do not match.");return;}
  setBusy(true);
  try{const {error:resetError}=await getSupabase().auth.updateUser({password});if(resetError)throw resetError;setDone(true);await getSupabase().auth.signOut();}
  catch(err){setError(err.message||"Could not update password.");}finally{setBusy(false);}
 }
 return <main className="investigator-auth-page"><Link className="investigator-back" href="/">← The Comparative Truth</Link><section className="investigator-auth-card"><p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>Reset your <em>Password.</em></h1>
 {done?<div className="investigator-auth-success"><h2>Password updated.</h2><p>You can now sign in using your new password.</p><p><Link href="/investigator/login">Return to Investigator Login →</Link></p></div>:ready?<><p className="investigator-auth-description">Choose a new password for your Investigator account.</p><form className="investigator-auth-form" onSubmit={submit}><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<p role="alert" className="investigator-auth-error">{error}</p>}<button type="submit" disabled={busy}>{busy?"Updating…":"Update Password →"}</button></form></>:<><p className="investigator-auth-description">Open the password-reset link from your email to continue. If your link has expired, request a new one from the login page.</p><p className="investigator-auth-foot"><Link href="/investigator/login">Return to Investigator Login →</Link></p></>}
 </section></main>;
}