import { NextResponse } from "next/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request){
 try {
  const bearer=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!bearer||!base||!pub||!secret)return NextResponse.json({error:"Not authorized"},{status:403});
  const ur=await fetch(base+"/auth/v1/user",{headers:{apikey:pub,Authorization:"Bearer "+bearer},cache:"no-store"});
  if(!ur.ok)return NextResponse.json({error:"Not authorized"},{status:403});
  const user=await ur.json();
  if(!user.id)return NextResponse.json({error:"Not authorized"},{status:403});
  const ar=await fetch(base+"/rest/v1/admin_users?user_id=eq."+encodeURIComponent(user.id)+"&select=user_id",{headers:{apikey:secret},cache:"no-store"});
  if(!ar.ok)throw new Error("Admin lookup failed");
  const admins=await ar.json();
  if(!admins.length)return NextResponse.json({error:"Not authorized"},{status:403});
  const token=process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId=process.env.VERCEL_ANALYTICS_PROJECT_ID;
  const teamId=process.env.VERCEL_ANALYTICS_TEAM_ID;
  if(!token||!projectId)return NextResponse.json({error:"Analytics configuration incomplete"},{status:503});
  const requested=Number(new URL(request.url).searchParams.get("days"));
  const days=[7,30,90].includes(requested)?requested:30;
  const end=new Date(),start=new Date(end);
  start.setUTCDate(start.getUTCDate()-days+1);
  async function query(kind,by,limit){
   const url=new URL("https://api.vercel.com/v1/query/web-analytics/visits/"+kind);
   url.searchParams.set("projectId",projectId);
   if(teamId)url.searchParams.set("teamId",teamId);
   url.searchParams.set("since",start.toISOString().slice(0,10));
   url.searchParams.set("until",end.toISOString().slice(0,10));
   if(by)url.searchParams.set("by",by);
   if(limit)url.searchParams.set("limit",String(limit));
   const res=await fetch(url,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   if(!res.ok)throw new Error("Vercel "+kind+" "+(by||"total")+" returned HTTP "+res.status);
   return (await res.json()).data;
  }
  const [trend,pages,referrers]=await Promise.all([query("aggregate","day"),query("aggregate","requestPath",8),query("aggregate","referrerHostname",8)]);
  const totals={pageviews:trend.reduce((n,row)=>n+Number(row.pageviews||0),0),visitors:null};
  return NextResponse.json({days,totals,trend,pages,referrers},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Analytics error",e.message);return NextResponse.json({error:e.message.startsWith("Vercel ")?e.message:"Analytics service unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}
