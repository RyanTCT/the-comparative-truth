import Link from "next/link";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Weigh In",
  description: "The Comparative Truth's community voting experience is coming soon. Investigators will be able to weigh in on each episode's central question.",
};

export default function WeighInPage() {
  return (
    <main style={{minHeight:"100vh",background:"#090a0c",color:"#f2eee6"}}>
      <SiteHeader />
      <section style={{maxWidth:880,margin:"0 auto",padding:"clamp(80px,12vw,145px) 24px 110px",textAlign:"center"}}>
        <p style={{color:"#c18b4d",letterSpacing:"3px",fontSize:12,fontWeight:700,textTransform:"uppercase",marginBottom:24}}>The Comparative Truth · Investigator Community</p>
        <h1 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:"clamp(44px,8vw,78px)",lineHeight:1.1,margin:"0 0 24px"}}>Weigh <em style={{color:"#c18b4d"}}>In.</em></h1>
        <p style={{color:"#c6c1b8",fontSize:"clamp(17px,2.5vw,21px)",lineHeight:1.7,maxWidth:670,margin:"0 auto 42px"}}>Every investigation begins with a question. Soon, registered Investigators will be able to cast their vote, see where the community stands, and reconsider the evidence.</p>
        <div style={{border:"1px solid #56432d",background:"linear-gradient(140deg,#1b1916,#101113)",padding:"clamp(28px,5vw,52px)",borderRadius:4}}>
          <p style={{color:"#c18b4d",letterSpacing:"2px",fontSize:11,fontWeight:700,textTransform:"uppercase",margin:"0 0 15px"}}>Community voting · Coming soon</p>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(26px,4vw,39px)",fontWeight:400,margin:"0 0 18px"}}>The Verdict Is Still Out.</h2>
          <p style={{color:"#bcb7ae",lineHeight:1.7,margin:"0 auto 28px",maxWidth:530}}>We're preparing episode-by-episode polls and community results. No votes are being collected yet. In the meantime, join the discussion and share your perspective.</p>
          <Link href="/community" style={{display:"inline-block",padding:"13px 23px",background:"#c18b4d",color:"#101010",fontSize:12,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Visit the Community Board →</Link>
        </div>
        <p style={{marginTop:35,fontSize:12,color:"#938a7f",letterSpacing:"1px"}}>OBSERVE. COMPARE. DISCERN. AND UNDERSTAND.</p>
      </section>
    </main>
  );
}
