import { useEffect, useRef, useState } from "react";
import { availability, rewrite } from "./localWriter";
import { type writingSuggestions, revise, type Passage } from "./writing";
import type { Resume } from "./model";
const goals = [
  "Fix grammar",
  "Make it more concise",
  "Use clearer action verbs",
];
export function WritingReview({
  fields,
  visible,
  dismiss,
  update,
}: {
  fields: Passage[];
  visible: ReturnType<typeof writingSuggestions>;
  dismiss: (key: string) => void;
  update: (fn: (r: Resume) => Resume) => void;
}) {
  const [selected, select] = useState(""),
    [goal, setGoal] = useState(goals[0]);
  const [available, ready] = useState("checking"),
    [busy, working] = useState(false),
    [message, notify] = useState(""),
    [proposal, propose] = useState<{ p: Passage; text: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    let live = true;
    availability().then((v) => {
      if (live) ready(v);
    });
    return () => {
      live = false;
      controller.current?.abort();
    };
  }, []);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const field = fields.find((v) => v.id === selected) ?? fields[0];
  const candidate =
    proposal?.p.id === field?.id && proposal?.p.text === field?.text
      ? proposal
      : null;
  async function generate() {
    if (!field) return;
    const request = new AbortController();
    controller.current = request;
    working(true);
    notify("");
    propose(null);
    try {
      const text = await rewrite(field.text, goal, request.signal);
      if (!request.signal.aborted) {
        if (text === field.text)
          notify("The model suggested keeping this passage as written.");
        else propose({ p: field, text });
        ready("available");
      }
    } catch {
      if (!request.signal.aborted)
        notify(
          "The browser could not finish this rewrite. Try a shorter passage or retry.",
        );
    } finally {
      if (controller.current === request) {
        working(false);
        controller.current = null;
      }
    }
  }
  return (
    <div className="checker writing-review">
      <section>
        <h3>
          {visible.length
            ? visible.length +
              (visible.length === 1 ? " suggestion" : " suggestions")
            : "Writing checks"}
        </h3>
        {!visible.length ? (
          <p>
            {fields.length
              ? "No spelling or wording issues found by the built-in checks."
              : "Add a headline, summary or section text to start checking."}
          </p>
        ) : (
          visible.map(({ p, i, key }) => {
            const replacement = i.after || (edits[key] ?? "").trim();
            return (
            <div key={key} className="writing-fix">
              <small>
                {p.label} · {i.reason}
              </small>
              <p>
                {i.after ? <><del>{i.before}</del> <strong>{i.after}</strong></> : <>Check the spelling of <strong>{i.before}</strong>. If it’s a name or a technical term, you can dismiss this.</>}
              </p>
              {!i.after && <label className="field">Your correction
                <input aria-label={"Correction for " + i.before} value={edits[key] ?? ""} placeholder="Type the word you meant"
                  onChange={e => setEdits({...edits, [key]: e.target.value})} />
              </label>}
              <div className="doc-actions">
                <button
                  disabled={!replacement || replacement === i.before}
                  onClick={() =>
                    update((r) =>
                      revise(
                        r,
                        p,
                        p.text.slice(0, i.start) +
                          replacement +
                          p.text.slice(i.start + i.before.length),
                        i.start + replacement.length,
                      ),
                    )
                  }
                >
                  Apply correction
                </button>
                <button onClick={() => dismiss(key)}>Dismiss</button>
              </div>
            </div>
          );})
        )}

        <h3>AI rewrite</h3>
        {available === "unavailable" ? (
          <p>
            AI rewriting is unavailable in this browser. Spelling and wording checks still work.
          </p>
        ) : available === "checking" ? (
          <p>Checking model availability…</p>
        ) : field ? (
          <>
            <label className="field">
              Passage
              <select
                disabled={busy}
                value={field.id}
                onChange={(e) => {
                  select(e.target.value);
                  propose(null);
                  notify("");
                }}
              >
                {fields.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              What to change
              <select
                disabled={busy}
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  propose(null);
                  notify("");
                }}
              >
                {goals.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <p className="writing-passage">{field.text}</p>
            <div className="doc-actions">
              <button disabled={busy} onClick={generate}>
                {busy
                  ? "Rewriting…"
                  : available === "downloadable"
                    ? "Download model and suggest rewrite"
                    : "Suggest rewrite"}
              </button>
              {busy && (
                <button onClick={() => controller.current?.abort()}>
                  Cancel
                </button>
              )}
            </div>
            {candidate && (
              <div className="writing-fix">
                <strong>Suggested rewrite</strong>
                <p className="writing-passage">{candidate.text}</p>
                <div className="doc-actions">
                  <button
                    onClick={() => {
                      update((r) => revise(r, candidate.p, candidate.text));
                      propose(null);
                    }}
                  >
                    Apply rewrite
                  </button>
                  <button onClick={() => propose(null)}>Dismiss rewrite</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p>Add a passage to request a rewrite.</p>
        )}
        <p role="status">{message}</p>
      </section>
    </div>
  );
}
