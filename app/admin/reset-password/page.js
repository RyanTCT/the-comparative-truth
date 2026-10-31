"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export default function ResetPassword(){
 const [showPassword,setShowPassword]=useState(false),[ready,setReady]=useState(false),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 useEffect(()=>{
  let active=true;
  const check=async()=>{const params=new URLSearchParams(window.location.search);const code=params.get("code");const tokenHash=params.get("token_hash");const type=params.get("type");let err=null;
   if(code){const result=await supabase.auth.exchangeCodeForSession(code);err=result.error;}
   else if(tokenHash&&type==="recovery"){const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type:"recovery"});err=result.error;}
   else if(window.location.hash.includes("access_token")){await new Promise(resolve=>setTimeout(resolve,350));}
   if(!active)return;
   if(err){setError("This recovery link is invalid or expired. Request a new link.");return;}
   const {data}=await supabase.auth.getSession();if(active){if(data.session)setReady(true);else setError("This recovery link is invalid or expired. Request a new link.");}
  };check();return()=>{active=false};
 },[]);
 async function submit(e){e.preventDefault();setError("");if(password.length<8){setError("Use at least 8 characters.");return}if(password!==confirm){setError("Passwords do not match.");return}setBusy(true);const {error:err}=await supabase.auth.updateUser({password});if(err)setError(err.message);else{setDone(true);setPassword("");setConfirm("");await supabase.auth.signOut()}setBusy(false)}
 return <main className="admin-page"><nav className="navbar"><a href="/" className="nav-brand">THE COMPARATIVE TRUTH</a></nav><section className="admin-wrap"><p className="section-label">ACCOUNT RECOVERY</p><h1>Reset <em>Password.</em></h1>{done?<div className="admin-login"><p>Your password has been updated.</p><a href="/admin">Return to administrator sign in →</a></div>:ready?<form className="admin-login" onSubmit={submit}><h2>Choose a new password</h2><label>New password<span className="admin-password-field"><input type={showPassword?"text":"password"} autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="admin-visibility" aria-label={showPassword?"Hide passwords":"Show passwords"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></span></label><label>Confirm password<input type={showPassword?"text":"password"} autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy}>{busy?"Saving…":"Update password →"}</button></form>:!error?<p>Checking your recovery link…</p>:null}{error&&<p role="alert" className="admin-error">{error} <a href="/admin">Return to sign in</a></p>}</section></main>
}
