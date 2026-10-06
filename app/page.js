export default function Home() {
  return (
    <main>

      <nav className="navbar">
        <div className="nav-brand">
          THE COMPARATIVE TRUTH
        </div>

        <div className="nav-links">
          <a href="#episodes">Episodes</a>
          <a href="#about">About</a>
          <a href="#research">Research</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>


      <section className="hero">

        <div className="hero-logo">
          <img
            src="/TCTLogo.jpg"
            alt="The Comparative Truth"
          />
        </div>

        <div className="hero-content">

          <p className="eyebrow">
            HISTORY • CULTURE • CONTEXT
          </p>

          <h1>
            THE COMPARATIVE
            <span>TRUTH</span>
          </h1>

          <h2>
            History Repeats Itself, But…
            <br />
            Are You Listening?
          </h2>

          <p className="hero-description">
            We have a habit of believing we're living through
            something unprecedented. Sometimes we are.
            Often, history has something to say about it.
          </p>

          <div className="hero-buttons">
            <a href="#episodes" className="button-primary">
              Latest Episode
            </a>

            <a href="#about" className="button-secondary">
              Explore the Show
            </a>
          </div>

        </div>

      </section>


      <section id="episodes" className="section episodes">

        <p className="section-label">
          LATEST EPISODE
        </p>

        <h2>
          What happens when yesterday's fears
          become today's reality?
        </h2>

        <p>
          The Comparative Truth examines modern questions
          through the lens of history—looking at what changed,
          what didn't, and what the comparison can actually
          teach us.
        </p>

      </section>


      <section id="about" className="section about">

        <p className="section-label">
          THE PREMISE
        </p>

        <h2>
          Where Past Meets Present.
        </h2>

        <p>
          Every generation believes its challenges are unique.
          New technology. New fears. New controversies.
          New predictions about what comes next.
        </p>

        <p>
          But sometimes the best way to understand where
          we're going is to look at where we've already been.
        </p>

      </section>


      <section id="research" className="section research">

        <p className="section-label">
          GO DEEPER
        </p>

        <h2>
          Research & Sources
        </h2>

        <p>
          Explore the studies, historical records, archival
          material, and reporting used to build each episode.
        </p>

      </section>


      <section id="contact" className="section contact">

        <p className="section-label">
          JOIN THE CONVERSATION
        </p>

        <h2>
          Have something worth comparing?
        </h2>

        <p>
          Episode ideas, questions, historical parallels,
          and listener feedback are always welcome.
        </p>

      </section>


      <footer>

        <div>
          <strong>
            THE COMPARATIVE TRUTH
          </strong>

          <p>
            Where Past Meets Present.
          </p>
        </div>

        <p>
          © 2026 Comparative Truth Productions
        </p>

      </footer>

    </main>
  );
}
