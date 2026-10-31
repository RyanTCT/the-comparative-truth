import { NextResponse } from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request){
 try{
  const bearer=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,"");
  const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!bearer||!base||!pub||!secret)return NextResponse.json({error:"Not authorized"},{status:403});
  const userRes=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+bearer},cache:"no-store"});
  if(!userRes.ok)return NextResponse.json({error:"Not authorized"},{status:403});
  const user=await userRes.json();
  if(!user.id)return NextResponse.json({error:"Not authorized"},{status:403});
  const headers={apikey:secret};
  const adminRes=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers,cache:"no-store"});
  if(!adminRes.ok||!(await adminRes.json()).length)return NextResponse.json({error:"Not authorized"},{status:403});
  async function read(path){
   const res=await fetch(base+"/rest/v1/"+path,{headers,cache:"no-store"});
   if(!res.ok)throw new Error("Unable to retrieve voting data");
   return res.json();
  }
  const [questions,options,votes]=await Promise.all([
   read("weigh_in_questions?select=id,episode_number,question,published,created_at&order=episode_number.asc,created_at.asc"),
   read("weigh_in_options?select=id,question_id,option_text,display_order&order=display_order.asc"),
   read("weigh_in_votes?select=question_id,option_id")
  ]);
  return NextResponse.json({questions:questions.map(q=>({...q,options:options.filter(o=>o.question_id===q.id).map(o=>({...o,votes:votes.filter(v=>v.option_id===o.id).length})),totalVotes:votes.filter(v=>v.question_id===q.id).length})),totalVotes:votes.length},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Weigh In admin error",e.message);return NextResponse.json({error:"Unable to load Weigh In data"},{status:503})}
}