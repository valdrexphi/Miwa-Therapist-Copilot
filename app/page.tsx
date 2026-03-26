import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Miwa",
  description:
    "Miwa helps therapists draft notes, organize clinical thinking, and prepare for supervision with a calm, review-first workflow.",
};

const featureCards = [
  {
    title: "Draft Cleaner Notes",
    description:
      "Turn de-identified session bullets into structured BIRP, SOAP, or DAP drafts that stay conservative and clinician-readable.",
  },
  {
    title: "Support Clinical Thinking",
    description:
      "Surface a tentative hypothesis, practical interventions, and next-session priorities without overstating certainty.",
  },
  {
    title: "Prepare For Supervision",
    description:
      "Generate sharper supervision questions, documentation flags, and diagnostic follow-up prompts tied to the case.",
  },
];

const differentiators = [
  "Built for therapist-facing review support rather than direct client interaction.",
  "Uses conservative wording that stays tentative when information is incomplete.",
  "Keeps documentation, formulation, diagnosis, and supervision support organized in one workflow.",
];

const workflowSteps = [
  {
    step: "1",
    title: "Enter de-identified session context",
    description:
      "Add the presenting problem, treatment goal, and brief session notes using only non-identifying information.",
  },
  {
    step: "2",
    title: "Choose the clinical frame",
    description:
      "Select your note format, output mode, and orientation so the draft reflects the way you already work.",
  },
  {
    step: "3",
    title: "Review and refine",
    description:
      "Copy, regenerate, and edit the output sections before using anything in documentation or supervision prep.",
  },
];

export default function HomePage() {
  return (
    <main id="top" className="landing-page">
      <section className="landing-hero">
        <div className="container landing-shell">
          <div className="hero-panel">
            <span className="eyebrow">Therapist-Support Prototype</span>
            <h1>Miwa</h1>
            <p className="hero-subtitle">
              Therapist-facing support for documentation drafting, formulation,
              diagnostic review, and supervision preparation.
            </p>
            <p className="hero-copy">
              Miwa helps therapists draft notes, organize clinical thinking, and
              prepare for supervision with a calm, review-first workflow.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="button landing-primary">
                Try the Prototype
              </Link>
              <a href="#how-it-works" className="secondary-button landing-secondary">
                See How It Works
              </a>
            </div>
            <div className="warning landing-warning">
              Therapist-support prototype only. Do not enter PHI or real
              client-identifying information. Output is for review support only
              and is not legal advice.
            </div>
          </div>

          <div className="hero-side-card">
            <div className="hero-side-content">
              <div className="section-kicker">What It Helps With</div>
              <h2>Miwa brings notes, formulation, diagnosis, and supervision prep into one focused workspace.</h2>
              <ul className="landing-list">
                <li>Draft structured BIRP, SOAP, or DAP notes.</li>
                <li>Surface tentative clinical hypotheses and interventions.</li>
                <li>Organize diagnostic considerations into scan-friendly cards.</li>
                <li>Highlight supervision questions and next-session priorities.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">What The Tool Helps With</span>
            <h2>Designed for the moments after session, when you need structure and judgment support.</h2>
            <p>
              The prototype is built to help therapists move from rough session
              notes to a more organized draft without turning documentation into
              a generic AI summary.
            </p>
          </div>

          <div className="landing-card-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="landing-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-soft">
        <div className="container landing-two-column">
          <div className="section-intro section-intro-compact">
            <span className="eyebrow">Why It Is Different</span>
            <h2>It stays cautious, clinically readable, and grounded in therapist review.</h2>
            <p>
              Instead of trying to sound definitive, the experience is structured
              to preserve uncertainty, highlight missing information, and support
              clinical judgment.
            </p>
          </div>

          <div className="landing-stack">
            {differentiators.map((item) => (
              <div key={item} className="landing-detail-card">
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Simple Workflow</span>
            <h2>From de-identified notes to a more usable clinical draft in three steps.</h2>
            <p>
              The experience is intentionally lightweight so early testers can
              focus on output quality, structure, and fit with real therapist
              workflow.
            </p>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((item) => (
              <article key={item.step} className="workflow-card">
                <div className="workflow-step">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="final-cta">
            <span className="eyebrow">Ready To Explore</span>
            <h2>Try Miwa and see how it fits your documentation workflow.</h2>
            <p>
              The current version is built for early testing, rapid iteration,
              and thoughtful therapist feedback.
            </p>
            <div className="hero-actions final-cta-actions">
              <Link href="/app" className="button landing-primary">
                Try the Prototype
              </Link>
              <a href="#top" className="secondary-button landing-secondary">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
