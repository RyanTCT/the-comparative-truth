"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@supabase/supabase-js";

const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});

export default function InvestigatorProfile(){
 const router=useRouter();
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[name,setName]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   const {data:{user:current},error:authError}=await supabase.auth.getUser();
   if(!active)return;
   if(authError||!current){router.replace("/investigator/login");return;}
   setUser(current);
   const {data,error:profileError}=await supabase.from("investigator_profiles").select("display_name,name_changed_at").eq("user_id",current.id).maybeSingle();
   if(!active)return;
   if(profileError)setError("Unable to load your Investigator profile. Please try refreshing.");
   else {setProfile(data);setName(data?.display_name||"");}
   setLoading(false);
  }
  load();
  return()=>{active=false};
 },[router]);
 async function save(e){
  e.preventDefault();setError("");setSuccess("");
  if(!/^[A-Za-z0-9_]{3,24}$/.test(name.trim())){setError("Use 3–24 letters, numbers, or underscores.");return;}
  setSaving(true);
  try{
   const {data,error:saveError}=await supabase.rpc("set_investigator_display_name",{requested_name:name.trim()});
   if(saveError)throw saveError;
   setProfile({display_name:data,name_changed_at:new Date().toISOString()});setName(data);
   setSuccess("Your public Investigator name has been saved.");
  }catch(err){setError(err.message||"Unable to save your Investigator name.");}
  finally{setSaving(false);}
 }
 const nextChange=profile?.name_changed_at?new Date(new Date(profile.name_changed_at).getTime()+30*86400000):null;
 const locked=nextChange&&nextChange>new Date();
 return <main className="investigator-auth-page"><Link className="investigator-back" href="/">← The Comparative Truth</Link><section className="investigator-auth-card">
 <p className="section-label">THE COMPARATIVE TRUTH • COMMUNITY</p><h1>My Investigator <em>Profile.</em></h1>
 {loading?<p className="investigator-auth-description">Loading your profile…</p>:<>
 <p className="investigator-auth-description">Choose the name other Investigators will see on your future discussion posts and comments. Your email address stays private.</p>
 {profile&&<div className="investigator-profile-current"><span>PUBLIC INVESTIGATOR NAME</span><strong>{profile.display_name}</strong></div>}
 <form className="investigator-auth-form" onSubmit={save}>
 <label>Investigator display name<input type="text" autoComplete="nickname" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" title="3–24 letters, numbers, or underscores" value={name} onChange={e=>setName(e.target.value)} disabled={Boolean(locked)||saving} placeholder="TruthSeeker87"/></label>
 <p className="investigator-auth-small">Names must be unique (case-insensitive). Use 3–24 letters, numbers, or underscores. You can change your name once every 30 days.</p>
 {locked&&<p className="investigator-auth-small">You can change your name again on {nextChange.toLocaleDateString()}.</p>}
 {error&&<p className="investigator-auth-error" role="alert">{error}</p>}
 {success&&<p className="investigator-auth-success" role="status">{success}</p>}
 {!locked&&<button type="submit" disabled={saving||!user?.email_confirmed_at}>{saving?"Saving…":profile?"Change Investigator Name →":"Claim Investigator Name →"}</button>}
 </form>
 {!user?.email_confirmed_at&&<p className="investigator-auth-error">Please verify your email address before choosing a display name.</p>}
 <p className="investigator-auth-foot"><Link href="/">Return to homepage →</Link></p>
 </>}
 </section></main>;
}
