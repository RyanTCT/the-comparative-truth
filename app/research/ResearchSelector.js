"use client";
import { useRouter } from "next/navigation";
export default function ResearchSelector({ selected }) {
  const router = useRouter();
  return <div className="research-selector-row">
    <label htmlFor="research-episode">Explore an episode</label>
    <select id="research-episode" value={selected} onChange={(e)=>router.push("/research?episode="+e.target.value,{scroll:false})}>
      <option value="03">Episode 03 — Is Technology Empowering Scammers?</option>
      <option value="02">Episode 02 — Are We Capable of Containing AI?</option>
      <option value="01">Episode 01 — Is Technology Destroying Our Attention Span?</option>
    </select>
  </div>;
}
