import { analyze, keywordHints } from "./analysis";
import type { Resume } from "./model";
import type { writingSuggestions } from "./writing";

export function Checker({
  resume,
  setJob,
  visible,
  openWriting,
}: {
  resume: Resume;
  setJob: (text: string) => void;
  visible: ReturnType<typeof writingSuggestions>;
  openWriting: () => void;
}) {
  const job = resume.jobDescription ?? "";
  const { tips, matched, missing, count } = analyze(resume, job);
  const near = keywordHints(resume, missing);
  const label = (word: string) =>
    ({
      dotnet: ".NET",
      nodejs: "Node.js",
      javascript: "JavaScript",
      typescript: "TypeScript",
      "power-bi": "Power BI",
      "version-control": "version control",
      "machine-learning": "machine learning",
    })[word] ?? word;
  return (
    <div className="checker">
      <section>
        <label className="field">
          Job description
          <textarea
            rows={4}
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Paste the job ad or enter the skills it asks for."
          />
        </label>
        {count ? (
          <>
            <h3>
              {matched.length} of {count} job terms found
            </h3>
            <p>
              <b>Already in your CV</b>
              <br />
              {matched.map(label).join(", ") || "None yet"}
            </p>
            {!!missing.length && (
              <>
                <p>
                  <b>Missing from your CV</b>
                  <br />
                  {missing.map(label).join(", ")}
                </p>
                <p>
                  If you have used {label(missing[0])}, add a real example in
                  Skills or Projects. Say what you did with it.
                </p>
              </>
            )}
          </>
        ) : (
          <p>
            {job.trim()
              ? "Try a specific skill or tool, such as Python or Excel."
              : "Add a job ad to see which words match your CV."}
          </p>
        )}
        {near.length > 0 && (
          <>
            <h3>Similar words to check</h3>
            <ul>
              {near.map((h) => (
                <li key={h.wanted}>
                  Your CV says “{label(h.written)}”. The job ad says “
                  {label(h.wanted)}”. Check which word you meant.
                </li>
              ))}
            </ul>
          </>
        )}
        <h3>Writing checks</h3>
        {visible.length ? (
          <>
            <p>
              {visible[0].p.label}: {visible[0].i.after ? <><del>{visible[0].i.before}</del>{" "}<strong>{visible[0].i.after}</strong></> : <>Check the spelling of “{visible[0].i.before}”.</>}
            </p>
            <button onClick={openWriting}>
              Review {visible.length}{" "}
              {visible.length === 1 ? "suggestion" : "suggestions"}
            </button>
          </>
        ) : (
          <p>No spelling or wording issues found by the built-in checks.</p>
        )}
        <h3>Ideas for your CV</h3>
        {tips.length ? (
          <ul>
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p>
            Your main sections are filled in. Pick one project and explain how
            you checked the result.
          </p>
        )}
      </section>
    </div>
  );
}
