export default function ResearchArchive() {
  return (
    <main>

      {/* NAVIGATION */}

      <nav className="navbar">
        <a href="/" className="nav-brand">
          THE COMPARATIVE TRUTH
        </a>

        <div className="nav-links">
          <a href="/#episodes">Episodes</a>
          <a href="/#about">About</a>
          <a href="/research">Research</a>
          <a href="/#contact">Contact</a>
        </div>
      </nav>


      {/* RESEARCH ARCHIVE HERO */}

      <section className="research-page-hero">

        <p className="section-label">
          GO DEEPER
        </p>

        <h1>
          Research & Sources
        </h1>

        <p>
          The Comparative Truth begins with a question, but the
          answer depends on the evidence.
        </p>

        <p>
          Explore the historical records, academic research,
          contemporary reporting, and primary and secondary
          sources used to build each episode.
        </p>

      </section>


      {/* ARCHIVE */}

      <section className="research-archive">

        <div className="archive-heading">

          <p className="section-label">
            RESEARCH ARCHIVE
          </p>

          <h2>
            Explore the Evidence.
          </h2>

        </div>


        {/* EPISODE 02 */}
        <article className="archive-entry">
          <div className="archive-number">02</div>
          <div className="archive-content">
            <p className="archive-episode-label">EPISODE 02</p>
            <h3>Are We Capable of Containing AI?</h3>
            <p>Research into autonomous AI security, the OpenAI–Hugging Face incident, U.S. Senate testimony, Y2K preparedness, and October 2026 AI accountability developments.</p>
            <a href="/research/episode-02" className="archive-link">View Episode Research →</a>
          </div>
        </article>

                {/* EPISODE 01 */}

        <article className="archive-entry">

          <div className="archive-number">
            01
          </div>

          <div className="archive-content">

            <p className="archive-episode-label">
              EPISODE 01
            </p>

            <h3>
              Is Technology Destroying Our Attention Span?
            </h3>

            <p>
              Research examining historical concerns surrounding
              television and comic books alongside modern studies
              of smartphones, notifications, short-form video,
              attention switching, and digital media.
            </p>

            <div className="archive-meta">
              SOURCE COUNT BEING VERIFIED
            </div>

            <a
              href="/research/episode-01"
              className="archive-link"
            >
              View Episode Research →
            </a>

          </div>

        </article>

      </section>


      {/* FOOTER */}

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

    </main>
  );
}
