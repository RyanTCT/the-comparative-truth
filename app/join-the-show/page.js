import SiteHeader from "../components/SiteHeader";
"use client";

import { useState } from "react";

const options = [
  { id: "guest", number: "01", title: "Be a Guest", description: "Bring your expertise, experience, or a different perspective to an upcoming conversation." },
  { id: "idea", number: "02", title: "Suggest an Investigation", description: "Tell us what question, story, or historical parallel deserves a closer look." },
];

export default function JoinTheShow() {
  const [selected, setSelected] = useState("guest");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [website, setWebsite] = useState("");
  const [values, setValues] = useState({ name: "", email: "", topic: "", background: "", perspective: "", sources: "" });
  const update = (event) => setValues((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const select = (id) => { setFeedback(null); setSelected(id); setValues({ name: "", email: "", topic: "", background: "", perspective: "", sources: "" }); };
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/join-the-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, submission_type: selected, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed. Please try again.");
      setFeedback({ success: true, message: "Thank you! Your submission was received and saved successfully." });
      setValues({ name: "", email: "", topic: "", background: "", perspective: "", sources: "" });
      setWebsite("");
    } catch (error) {
      setFeedback({ success: false, message: error.message || "We couldn't submit your message. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <SiteHeader />

      <section className="join-hero">
        <p className="section-label">YOUR VOICE. YOUR PERSPECTIVE.</p>
        <h1>Join the <em>Conversation.</em></h1>
        <p>The most compelling investigations begin with a question. Whether you have firsthand experience, a perspective worth hearing, or an idea worth exploring, we invite you to contribute.</p>
        <div className="join-rule" />
        <p className="join-motto">Explore. Compare. Discern. Understand. <span>And then—you decide.</span></p>
      </section>

      <section className="join-body">
        <div className="join-heading">
          <p className="section-label">GET INVOLVED</p>
          <h2>How would you like to contribute?</h2>
          <p>Choose an option below to get started.</p>
        </div>

        <div className="join-options" role="group" aria-label="Submission type">
          {options.map((option) => (
            <button type="button" key={option.id} className={"join-option" + (selected === option.id ? " active" : "")} onClick={() => select(option.id)} aria-pressed={selected === option.id}>
              <span className="join-option-number">{option.number}</span>
              <strong>{option.title}</strong>
              <span>{option.description}</span>
              <span className="join-option-action">{selected === option.id ? "Selected ✓" : "Select →"}</span>
            </button>
          ))}
        </div>

        <div className="join-form-shell">
          <div className="join-form-intro">
            <p className="section-label">{selected === "guest" ? "GUEST APPLICATION" : "EPISODE IDEA"}</p>
            <h2>{selected === "guest" ? "Tell us your story." : "What should we investigate?"}</h2>
            <p>{selected === "guest" ? "Tell us what you'd bring to the conversation. Expertise is welcome, but compelling lived experience and thoughtful opposing perspectives matter, too." : "What deserves a closer examination? Share the question, why it matters, and any evidence or sources that might help us get started."}</p>
          </div>
          <form className="join-form" onSubmit={submit}>
            <div className="join-honeypot" aria-hidden="true"><label>Website<input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
            <div className="join-form-row">
              <label>Full name <span>*</span><input name="name" value={values.name} onChange={update} required maxLength={120} autoComplete="name" placeholder="Your name" /></label>
              <label>Email address {selected === "guest" && <span>*</span>}<input name="email" type="email" value={values.email} onChange={update} required={selected === "guest"} maxLength={200} autoComplete="email" placeholder="you@example.com" /></label>
            </div>
            <label>{selected === "guest" ? "Proposed discussion topic" : "Proposed episode topic"} <span>*</span><input name="topic" value={values.topic} onChange={update} required maxLength={200} placeholder={selected === "guest" ? "What would you like to discuss?" : "What question should we explore?"} /></label>
            {selected === "guest" && <label>Background or relevant experience <span>*</span><textarea name="background" value={values.background} onChange={update} required maxLength={2000} rows={4} placeholder="Your experience, expertise, or connection to the subject" /></label>}
            <label>{selected === "guest" ? "What perspective would you bring?" : "Why is this worth investigating?"} <span>*</span><textarea name="perspective" value={values.perspective} onChange={update} required maxLength={3000} rows={5} placeholder={selected === "guest" ? "What might listeners learn from your perspective?" : "What makes this story important or interesting?"} /></label>
            {selected === "idea" && <label>Supporting sources or links (optional)<textarea name="sources" value={values.sources} onChange={update} maxLength={2000} rows={3} placeholder="Articles, studies, records, or other leads" /></label>}
            <p className="join-privacy">Please do not submit confidential, sensitive, or private information. Submissions may be reviewed for future episodes; submitting does not guarantee selection.</p>
            <button className="join-submit" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit " + (selected === "guest" ? "Guest Application" : "Episode Idea") + " →"}</button>
            {feedback && <p role="status" className={"join-delivery-note " + (feedback.success ? "join-success" : "join-error")}>{feedback.message}</p>}
            <p className="join-delivery-note">Your submission is saved privately for review. Email notifications are not yet enabled.</p>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand"><strong>THE COMPARATIVE TRUTH</strong><p>Explore. Compare. Discern. Understand.</p></div>
        <div className="footer-links"><a href="/">Home</a><a href="/episodes">Episodes</a><a href="/research">Research</a><a href="/join-the-show">Join the Show</a></div>
        <div className="footer-production"><span>A Comparative Truth Productions Podcast</span><p>© 2026 Comparative Truth Productions</p></div>
      </footer>
    </main>
  );
}
