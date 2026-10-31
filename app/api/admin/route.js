import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail=(message,status)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
async function authorize(request){
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
 const secret=process.env.SUPABASE_SECRET_KEY;
 const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!token||!url||!secret||!pub)return null;
 const userResponse=await fetch(url+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+token},cache:"no-store"});
 if(!userResponse.ok)return null;
 const user=await userResponse.json();
 if(!user.id)return null;
 const check=await fetch(url+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers:{apikey:secret},cache:"no-store"});
 if(!check.ok)throw new Error("Admin permission check failed");
 const rows=await check.json();
 return rows.length?{url,secret,user}:null;
}
async function handle(request,action){
 try{
  const auth=await authorize(request);
  if(!auth)return fail("Not authorized.",403);
  const headers={apikey:auth.secret,"Content-Type":"application/json"};
  if(action==="GET"){
   const res=await fetch(auth.url+"/rest/v1/show_submissions?select=id,submission_type,name,email,topic,background,perspective,sources,status,created_at&order=created_at.desc&limit=200",{headers,cache:"no-store"});
   if(!res.ok)throw new Error("Could not load submissions");
   return NextResponse.json({submissions:await res.json()},{headers:{"Cache-Control":"no-store"}});
  }
  const body=await request.json();
  if(!body||typeof body.id!=="string"||!/^[0-9a-f-]{36}$/i.test(body.id)||!["new","under_review","accepted","archived"].includes(body.status))return fail("Invalid update.",400);
  const res=await fetch(auth.url+"/rest/v1/show_submissions?id=eq."+encodeURIComponent(body.id),{method:"PATCH",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify({status:body.status}),cache:"no-store"});
  if(!res.ok)throw new Error("Could not update status");
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Admin request error",e.message);return fail("Admin service unavailable.",503);}
}
export async function GET(request){return handle(request,"GET")}
export async function PATCH(request){return handle(request,"PATCH")}
