import "./research.css";
import SiteHeader from "../components/SiteHeader";
import ResearchSelector from "./ResearchSelector";
import Episode03Research from "./episode-03/page";
import Episode02Research from "./episode-02/page";
import Episode01Research from "./episode-01/page";

export default async function ResearchArchive({ searchParams }) {
  const params = await searchParams;
  const selected = ["01","02","03"].includes(params?.episode) ? params.episode : "03";
  const CurrentResearch = selected === "01" ? Episode01Research : selected === "02" ? Episode02Research : Episode03Research;
  return <main className="research-index-page">
    <SiteHeader />
      <section className="research-page-hero">

        <p className="section-label">
          GO DEEPER
        </p>

        <h1>
          Research & <em>Sources.</em>
        </h1>

        <p className="research-intro-lead">
          The Comparative Truth begins with a question, but the
          answer depends on the evidence.
        </p>

        <p>
          Explore the historical records, academic research,
          contemporary reporting, and primary and secondary
          sources used to build each episode.
        </p>

      </section>



    <section className="research-archive research-live-archive">
      <div className="archive-heading">
        <p className="section-label">EXPLORE THE EVIDENCE</p>
        <h2>Research & References</h2>
      </div>
      <ResearchSelector selected={selected} />
      <div className="research-embedded"><CurrentResearch /></div>
    </section>
<footer className="site-footer">

  <div className="footer-brand">

    <strong>
      THE COMPARATIVE TRUTH
    </strong>

    <p>
      Explore. Compare. Discern. Understand.
    </p>

  </div>


  <div className="footer-links">

    <a href="/#episodes">
      Episodes
    </a>

    <a href="/#about">
      About
    </a>

    <a href="/research">
      Research
    </a>

    <a href="/#contact">
      Contact
    </a>

  </div>


  <div className="footer-production">

    <span>
      A Comparative Truth Productions Podcast
    </span>

    <p>
      © 2026 Comparative Truth Productions
    </p>

  </div>

</footer>


  </main>;
}
