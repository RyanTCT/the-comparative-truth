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

  <a
    href="https://podcasts.apple.com/us/podcast/the-comparative-truth/id6809671032"
    target="_blank"
    rel="noopener noreferrer"
    className="platform-button"
  >
    Apple Podcasts
  </a>

  <a
    href="https://open.spotify.com/episode/5QRU1cIJwpmuHAqMLUWHCu?si=4FDFKQqMTGe7ad8XMCbSug&utm_source=copy-link"
    target="_blank"
    rel="noopener noreferrer"
    className="platform-button"
  >
    Spotify
  </a>

  <a
    href="https://music.amazon.com/podcasts/2269c385-7913-4c1e-8ea6-ca33814db14c/the-comparative-truth"
    target="_blank"
    rel="noopener noreferrer"
    className="platform-button"
  >
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
    History Gives Us Another Lens.
  </h2>

  <p>
    We are faced with problems, controversies, and tragedies every day.
    Some are preventable. Some are not.
  </p>

  <p>
    History cannot predict what happens next, nor can it prevent us from
    repeating the mistakes of the past. But it can give us a lens through
    which to view the present—and sometimes, a clearer understanding of
    where we may be going.
  </p>

  <p>
    The Comparative Truth looks backward to better understand what is
    happening now. We examine the history, compare it with the present,
    and follow the evidence wherever it leads.
  </p>

  <div className="premise-statement">
    <strong>
      Explore. Compare. Discern. Understand.
    </strong>

    <span>
      And then—you decide.
    </span>
  </div>

</section>



      {/* RESEARCH */}

     <section id="research" className="research">

  <div className="research-container">

    <div className="research-intro">

      <p className="section-label">
        GO DEEPER
      </p>

      <h2>
        Research & Sources
      </h2>

      <p>
        Every episode of The Comparative Truth is built from
        historical records, academic research, contemporary
        reporting, and other primary and secondary sources.
      </p>

    </div>


    <div className="research-feature">

      <div className="research-feature-label">
        LATEST RESEARCH
      </div>

      <p className="research-episode-number">
        EPISODE 01
      </p>

      <h3>
        Is Technology Destroying
        <br />
        Our Attention Span?
      </h3>

      <p className="research-summary">
        Explore the research behind Episode 01, including
        historical concerns surrounding television and comic
        books, modern research on smartphones and notifications,
        and studies examining how technology affects attention.
      </p>

      <div className="research-actions">

        <span className="research-button">
          View Episode Research →
        </span>

        <span className="research-archive-link">
          Browse Research Archive →
        </span>

      </div>

    </div>

  </div>

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
