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


      {/* HERO */}

      <section className="hero">

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


      {/* LATEST EPISODE */}

      <section id="episodes" className="latest-episode">

        <div className="episode-container">

          <div className="episode-artwork">
            <img
              src="/E01_artwork.png"
              alt="Episode 01 - Is Technology Destroying Our Attention Span?"
            />
          </div>


          <div className="episode-content">

            <p className="section-label">
              LATEST EPISODE
            </p>

            <p className="episode-number">
              EPISODE 01
            </p>

            <h2>
              Is Technology Destroying
              <br />
              Our Attention Span?
            </h2>

            <p className="episode-description">
              For generations, new forms of media have been blamed
              for changing the way we think and pay attention.
              Television was accused of shortening children's
              attention spans. Comic books were blamed for corrupting
              young minds. Today, the concern has shifted to
              smartphones, notifications, and short-form video.
            </p>

            <p className="episode-description">
              But is technology actually destroying our attention
              span—or has the environment competing for our attention
              simply changed?
            </p>

            <div className="episode-meta">
              <span>EPISODE 01</span>
              <span className="meta-divider"></span>
              <span>24 MIN</span>
            </div>


            <div className="listen-area">

              <p className="listen-label">
                LISTEN TO EPISODE
              </p>

              <div className="platform-buttons">

                <a href="#" className="platform-button">
                  Apple Podcasts
                </a>

                <a href="#" className="platform-button">
                  Spotify
                </a>

                <a href="#" className="platform-button">
                  Amazon Music
                </a>

              </div>

            </div>


            <a href="#research" className="research-link">
              View Research & Sources →
            </a>

          </div>

        </div>

      </section>


      {/* ABOUT */}

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


      {/* RESEARCH */}

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


      {/* CONTACT */}

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


      {/* FOOTER */}

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
