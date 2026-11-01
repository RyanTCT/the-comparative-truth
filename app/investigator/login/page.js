"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@supabase/supabase-js";

let browserSupabase;
function getSupabase(){
 if(typeof window==="undefined")return null;
 if(!browserSupabase)browserSupabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 return browserSupabase;
}

export default function InvestigatorLogin(){
 const router=useRouter();
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState(""),[recovering,setRecovering]=useState(false);
 async function submit(e){
  e.preventDefault();setError("");setNotice("");setBusy(true);
  try{
   const {data,error:loginError}=await getSupabase().auth.signInWithPassword({email:email.trim(),password});
   if(loginError)throw loginError;
   if(!data?.user?.email_confirmed_at){await getSupabase().auth.signOut();throw new Error("Please verify your email address before signing in.");}
   router.replace("/");
   router.refresh();
  }catch(err){setError(err.message||"Unable to sign in. Please try again.");}
  finally{setBusy(false);}
 }
 async function resetPassword(){
  setError("");setNotice("");
  if(!email.trim()){setError("Enter your email address above to request a password reset.");return;}
  setBusy(true);
  try{
   const {error:resetError}=await getSupabase().auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/investigator/reset-password"});
   if(resetError)throw resetError;
   setNotice("If an account exists for this email, a password reset link will arrive shortly. Check your spam folder too.");
  }catch(err){setError(err.message||"Unable to send a password reset email.");}
  finally{setBusy(false);}
 }
 return <main className="investigator-auth-page"><Link className="investigator-back" href="/">← The Comparative Truth</Link><section className="investigator-auth-card">
 <p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>Investigator <em>Login.</em></h1>
 <p className="investigator-auth-description">Welcome back. Sign in to join the conversation and weigh in on the evidence.</p>
 <form onSubmit={submit} className="investigator-auth-form">
 <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
 <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>
 {error&&<p role="alert" className="investigator-auth-error">{error}</p>}
 {notice&&<p role="status" className="investigator-auth-success">{notice}</p>}
 <button type="submit" disabled={busy}>{busy?"Please wait…":"Sign In →"}</button>
 </form>
 <p className="investigator-auth-foot"><button type="button" className="investigator-text-button" disabled={busy} onClick={resetPassword}>Forgot password?</button></p>
 <p className="investigator-auth-foot">New to The Comparative Truth? <Link href="/investigator/register">Become an Investigator</Link></p>
 <p className="investigator-auth-small">Your account is shared with The Comparative Truth iPhone app. Email verification is required to participate.</p>
 </section></main>;
}
