import { TemplateGallery } from "./TemplateGallery";
import { useState } from "react";
import { Brand } from "./Brand";
import { FileText } from "./Icons";
import { Paper } from "./Paper";
import { initial } from "./model";
const showcase = initial;
export function Landing({
  create,
  theme,
}: {
  create: (sample?: boolean, template?: string) => void;
  theme: React.ReactNode;
}) {
  const [sampleMode, setSampleMode] = useState<"creative" | "ats">("creative");
  return (
    <main className="landing">
      <header className="siteheader">
        <Brand />
        <nav>
          <a href="#templates">Templates</a>
          <a href="#guide">How it works</a>
          <a href="#questions">FAQ</a>
        </nav>
        <div className="actions">
          {theme}
          <a className="btn outline" href="#/workspace">
            My resumes
          </a>
        </div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">CV BUILDER</div>
          <h1>
            Build your CV
            <br />
            <em>in one place.</em>
          </h1>
          <p>
            Choose a template, add your details, and download your CV as a PDF.
          </p>
          <div className="actions">
            <button className="btn primary" onClick={() => create()}>
              Create my resume
            </button>
            <a className="btn outline workspace-cta" href="#/workspace">
              My resumes
            </a>
          </div>
          <div className="sample-action">
            <button className="text-btn" onClick={() => create(true)}>
              Try a sample
            </button>
          </div>
          <small>Free to use. No account required.</small>
        </div>
        <div className="desk">
          <svg
            className="contours"
            viewBox="0 0 600 480"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 32 }, (_, i) => (
              <path
                key={i}
                d={`M -90 ${-130 + i * 6} C 160 ${480 + i * 8}, 400 ${-180 + i * 7}, 720 ${180 + i * 11}`}
              />
            ))}
          </svg>
          <div className="desk-meta">
            <span>
              <FileText size={14} /> Template preview
            </span>
            <span>A4</span>
          </div>
          <div className="desk-back" />
          <div
            className="desk-sheet"
            aria-label="CV preview for Gaweesha Bhagyajith Kumarathunga"
          >
            <Paper resume={{ ...showcase, mode: sampleMode }} />
          </div>
          <div className="specimen-switch" aria-label="Sample format">
            {(["creative", "ats"] as const).map((mode) => (
              <button
                key={mode}
                aria-pressed={sampleMode === mode}
                onClick={() => setSampleMode(mode)}
              >
                {mode === "creative" ? "Creative" : "Strict ATS"}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="feature-strip">
        {["ATS formatting", "Live design preview", "Private by default"].map(
          (title) => (
            <div key={title}>{title}</div>
          ),
        )}
      </div>
      <section className="content-section" id="templates">
        <div className="eyebrow">TEMPLATES</div>
        <h2>Choose a CV template.</h2>
        <TemplateGallery choose={(id) => create(false, id)} />
      </section>
      <section id="guide" className="content-section">
        <h2>From draft to PDF.</h2>
        <div className="steps">
          {[
            [
              "Write",
              "Start fresh or open a sample. Add your contact details, experience, education, and projects.",
            ],
            [
              "Edit",
              "Switch styles, rearrange sections, and see your edits on the page.",
            ],
            [
              "Download",
              "Choose Download PDF for a clean copy. Save a JSON backup if you want to edit it later.",
            ],
          ].map(([h, p]) => (
            <article key={h}>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="questions" className="content-section faq">
        <h2>Common questions</h2>
        {[
          [
            "Where is my resume saved?",
            "Drafts stay in this browser on this device. Clearing site data or using private browsing can erase them. Export a JSON backup to move or recover a draft.",
          ],
          [
            "Will my resume pass every ATS?",
            "Employers use different systems. Strict ATS mode keeps the document simple and readable. Screening outcomes depend on the employer and the content.",
          ],
          [
            "Can I use the studio offline?",
            "The included standalone HTML works offline in a desktop browser. Keep your file in the same location and back up drafts regularly.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <footer>
        <Brand />
        <div className="creator-credit">
          <strong>Built by Gaweesha Bhagyajith Kumarathunga</strong>
          <div className="creator-links">
            <a href="mailto:gaweesha2003@gmail.com">gaweesha2003@gmail.com</a>
            <a href="https://www.linkedin.com/in/r-p-g-b-kumarathunga-0a8568351?utm_source=share_via&amp;utm_content=profile&amp;utm_medium=member_ios">LinkedIn</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
