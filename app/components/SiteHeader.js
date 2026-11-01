import Link from "next/link";
import InvestigatorMenu from "./InvestigatorMenu";

export default function SiteHeader(){
 return <nav className="navbar" aria-label="Main navigation">
  <Link href="/" className="nav-brand">THE COMPARATIVE TRUTH</Link>
  <div className="nav-links">
   <Link href="/#episodes">Episodes</Link>
   <Link href="/#about">About</Link>
   <Link href="/#research">Research</Link>
   <Link href="/community">Community</Link>
   <Link href="/join-the-show">Join the Show</Link>
  </div>
  <InvestigatorMenu />
 </nav>;
}
