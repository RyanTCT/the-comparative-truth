import {NextResponse} from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function authorize(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,""),pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
 if(!token||!base||!pub||!secret)return null;
 const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token},cache:"no-store"});
 if(!userRes.ok)return null;
 const user=await userRes.json();
 const adminRes=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers:{apikey:secret},cache:"no-store"});
 if(!adminRes.ok)throw Error("Admin authorization unavailable");
 if(!(await adminRes.json()).length)return null;
 return {base,headers:{apikey:secret,"Content-Type":"application/json"}};
}
async function db(auth,table,method="GET",body=null,prefer="return=representation"){
 const res=await fetch(auth.base+"/rest/v1/"+table,{method,headers:{...auth.headers,Prefer:prefer},...(body===null?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 if(!res.ok){const detail=(await res.text()).slice(0,350);console.error("Community title database request failed",res.status,detail);const missing=res.status===404||detail.includes("PGRST205")||detail.includes("42P01");throw Error(missing?"Community title tables are missing. Run supabase/community_titles.sql in the Supabase SQL Editor.":res.status===409?"That title or assignment already exists.":"Community title database request failed (HTTP "+res.status+"). Check database permissions and server logs.");}
 return prefer==="return=minimal"?null:res.json();
}
async function handle(request,method){
 let auth;try{auth=await authorize(request)}catch{return reply({error:"Admin authorization unavailable"},503)}
 if(!auth)return reply({error:"Not authorized"},403);
 try{
  if(method==="GET"){
   const [titles,assignments,profiles]=await Promise.all([db(auth,"community_titles?select=id,name,badge_color,is_default&order=name.asc"),db(auth,"investigator_title_assignments?select=user_id,title_id"),db(auth,"investigator_profiles?select=user_id,display_name&order=display_name.asc")]);
   return reply({titles,assignments,profiles});
  }
  const body=await request.json();
  if(method==="POST"){
   const name=typeof body.name==="string"?body.name.trim():"",color=body.badge_color||"#c18b4d";
   if(name.length<2||name.length>40||!/^#[0-9a-fA-F]{6}$/.test(color))return reply({error:"Provide a title (2–40 characters) and a valid color."},400);
   await db(auth,"community_titles","POST",{name,badge_color:color,is_default:false});
  }else if(method==="PATCH"){
   if(!/^[0-9a-f-]{36}$/i.test(body.id||""))return reply({error:"Invalid title ID"},400);
   const rows=await db(auth,"community_titles?id=eq."+encodeURIComponent(body.id)+"&select=id,is_default");
   if(!rows.length)return reply({error:"Title not found"},404);
   if(rows[0].is_default)return reply({error:"The default Investigator title cannot be changed."},400);
   const name=typeof body.name==="string"?body.name.trim():"",color=body.badge_color;
   if(name.length<2||name.length>40||!/^#[0-9a-fA-F]{6}$/.test(color||""))return reply({error:"Invalid title or color"},400);
   await db(auth,"community_titles?id=eq."+encodeURIComponent(body.id),"PATCH",{name,badge_color:color});
  }else if(method==="DELETE"){
   if(!/^[0-9a-f-]{36}$/i.test(body.id||""))return reply({error:"Invalid title ID"},400);
   const rows=await db(auth,"community_titles?id=eq."+encodeURIComponent(body.id)+"&select=is_default");
   if(!rows.length)return reply({error:"Title not found"},404);
   if(rows[0].is_default)return reply({error:"Cannot delete the default Investigator title"},400);
   await db(auth,"community_titles?id=eq."+encodeURIComponent(body.id),"DELETE",null,"return=minimal");
  }else if(method==="PUT"){
   if(!/^[0-9a-f-]{36}$/i.test(body.title_id||"")||!/^[0-9a-f-]{36}$/i.test(body.user_id||""))return reply({error:"Invalid assignment"},400);
   const titles=await db(auth,"community_titles?id=eq."+encodeURIComponent(body.title_id)+"&select=is_default");
   if(!titles.length||titles[0].is_default)return reply({error:"Select a special title"},400);
   if(body.assign===true)await db(auth,"investigator_title_assignments","POST",{user_id:body.user_id,title_id:body.title_id}, "resolution=merge-duplicates,return=representation");
   else if(body.assign===false)await db(auth,"investigator_title_assignments?user_id=eq."+encodeURIComponent(body.user_id)+"&title_id=eq."+encodeURIComponent(body.title_id),"DELETE",null,"return=minimal");
   else return reply({error:"Invalid assignment action"},400);
  }
  return reply({ok:true});
 }catch(e){console.error("Community title admin failure",e.message);return reply({error:e.message||"Community titles request failed."},503)}
}
export const GET=request=>handle(request,"GET");
export const POST=request=>handle(request,"POST");
export const PATCH=request=>handle(request,"PATCH");
export const DELETE=request=>handle(request,"DELETE");
export const PUT=request=>handle(request,"PUT");
