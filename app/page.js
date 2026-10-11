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
              src="/E02_artwork.png"
              alt="Episode 02 - Are We Capable of Containing AI?"
            />
          </div>


          <div className="episode-content">

            <p className="section-label">
              LATEST EPISODE
            </p>

            <p className="episode-number">EPISODE 02</p>
            <h2>Are We Capable of<br />Containing AI?</h2>
            <p className="episode-description">As autonomous AI agents become increasingly capable, questions about cybersecurity, safeguards, and accountability are becoming harder to ignore.</p>
            <p className="episode-description">We examine the OpenAI–Hugging Face security incident, testimony from a U.S. Senate hearing, and a cybersecurity professional's perspective—then look back at Y2K to ask what history can teach us about preparing for technological risks.</p>
            <div className="episode-meta"><span>EPISODE 02</span></div>
            <div className="listen-area">

              <p className="listen-label">
                LISTEN TO EPISODE
              </p>

              <div className="platform-buttons">
                <a href="https://podcasts.apple.com/us/podcast/are-we-capable-of-containing-ai/id6809671032?i=1000795198049" target="_blank" rel="noopener noreferrer" className="platform-button">Apple Podcasts</a>
                <a href="https://open.spotify.com/episode/1FDu0a9108FBsteslFNPRg?si=UuYTOBf2Sf6_YWtTIoj0LQ" target="_blank" rel="noopener noreferrer" className="platform-button">Spotify</a>
                <a href="https://music.amazon.com/podcasts/2269c385-7913-4c1e-8ea6-ca33814db14c/episodes/56d8d279-9155-4bb4-bbde-739b7a541d24/the-comparative-truth-are-we-capable-of-containing-ai" target="_blank" rel="noopener noreferrer" className="platform-button">Amazon Music</a>
              </div>

            </div>


            <a href="/research/episode-02" className="research-link">
              View Research & Sources →
            </a>
            <div><a href="/episodes" className="research-link">Browse All Episodes →</a></div>

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

      <p className="research-episode-number">EPISODE 02</p>
      <h3>Are We Capable of<br />Containing AI?</h3>
      <p className="research-summary">Explore the original reporting, AI security disclosures, Senate testimony, historical Y2K assessments, and October 2026 developments behind Episode 02.</p>
      <div className="research-actions">

<a
  href="/research/episode-02"
  className="research-button"
>
  View Episode Research →
</a>

      <a
  href="/research"
  className="research-archive-link"
>
  Browse Research Archive →
</a>

      </div>

    </div>

  </div>

</section>


{/* CONTACT */}

<section id="contact" className="contact">

  <div className="contact-container">

    <div className="contact-intro">

      <p className="section-label">
        JOIN THE CONVERSATION
      </p>

      <h2>
        Have Something
        <br />
        Worth Comparing?
      </h2>

      <p>
        History gets more interesting when we start asking better
        questions. If you have an episode idea, a historical parallel,
        a source worth exploring, or a different perspective on
        something we've covered, we want to hear it.
      </p>

    </div>


    <div className="contact-options">

      <div className="contact-item">

        <span className="contact-number">
          01
        </span>

        <div>
          <h3>
            Suggest an Episode
          </h3>

          <p>
            See a story unfolding today that reminds you of something
            from the past? Send it our way.
          </p>
        </div>

      </div>


      <div className="contact-item">

        <span className="contact-number">
          02
        </span>

        <div>
          <h3>
            Challenge the Comparison
          </h3>

          <p>
            Think we missed something, found a source we should see,
            or reached a conclusion worth questioning? That's part
            of the conversation too.
          </p>
        </div>

      </div>


      <div className="contact-item">

        <span className="contact-number">
          03
        </span>

        <div>
          <h3>
            Share Your Perspective
          </h3>

          <p>
            History rarely gives us only one way to interpret the
            present. Tell us what you see through the lens.
          </p>
        </div>

      </div>


      <a
        href="mailto:contact@comparativetruth.com"
        className="contact-button"
      >
        Start the Conversation →
      </a>

    </div>

  </div>

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
