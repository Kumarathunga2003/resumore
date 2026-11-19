import { useState, useRef } from "react";
import { Brand } from "./Brand";
import { Paper } from "./Paper";
import { Plus, FileText } from "./Icons";
import { backup, fromBackup, type Draft } from "./model";
export function Dashboard({
  docs,
  save,
  remove,
  create,
  theme,
}: {
  docs: Draft[];
  save: (d: Draft) => void;
  remove: (id: string) => void;
  create: (sample?: boolean) => void;
  theme: React.ReactNode;
}) {
  const [query, search] = useState(""),
    [message, setMessage] = useState("");
  const [source, setSource] = useState<Draft | null>(null),
    [jobTitle, setJobTitle] = useState(""),
    [description, setDescription] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const filtered = docs
    .filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updated - a.updated);
  return (
    <main className="dashboard">
      <header className="siteheader">
        <Brand />
        {theme}
      </header>
      <section className="content-section">
        <div className="dashboard-intro">
          <div className="eyebrow">SAVED CVS</div>
          <h1>My resumes</h1>
          <p>Open a saved CV or make a new one.</p>
        </div>
        <div className="actions wrap">
          <button className="btn primary" onClick={() => create()}>
            New resume
          </button>
          <button className="btn outline" onClick={() => create(true)}>
            Use a sample
          </button>
          <button
            className="btn outline"
            onClick={() => picker.current?.click()}
          >
            Import backup
          </button>
          <input
            type="file"
            accept=".json,application/json"
            ref={picker}
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                if (f.size > 2000000)
                  throw Error("Choose a backup smaller than 2 MB.");
                save(fromBackup(JSON.parse(await f.text())));
                setMessage("Backup imported.");
              } catch (err) {
                setMessage(
                  err instanceof Error
                    ? err.message
                    : "Could not import this backup.",
                );
              }
            }}
          />
        </div>
        {source && (
          <form
            className="version-form"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!jobTitle.trim()) return;
              const version = {
                ...source,
                id: crypto.randomUUID(),
                title: jobTitle.trim(),
                updated: Date.now(),
                resume: {
                  ...structuredClone(source.resume),
                  targetJob: jobTitle.trim(),
                  jobDescription: description.trim(),
                },
              };
              save(version);
              location.hash = "/edit/" + version.id;
            }}
          >
            <h2>Create a job version</h2>
            <p>Start with a copy of {source.title}.</p>
            <label className="field">
              Version name
              <input
                autoFocus
                required
                maxLength={160}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Software Engineering Internship"
              />
            </label>
            <label className="field">
              Job description
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="doc-actions">
              <button type="submit" disabled={!jobTitle.trim()}>
                Create version
              </button>
              <button type="button" onClick={() => setSource(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
        <p role="status">{message}</p>
        <input
          className="search"
          aria-label="Search resumes"
          placeholder="Search resumes…"
          value={query}
          onChange={(e) => search(e.target.value)}
        />
        {!filtered.length ? (
          <div className="empty">
            <FileText size={32} />
            <h2>
              {docs.length
                ? "No matching resumes"
                : "Your first draft starts here."}
            </h2>
            <p>
              {docs.length
                ? "Try a different search."
                : "Choose New resume to begin, or explore a sample with content already filled in."}
            </p>
          </div>
        ) : (
          <div className="docs">
            {filtered.map((d) => (
              <article key={d.id}>
                <a
                  className="thumb"
                  href={"#/edit/" + d.id}
                  aria-label={"Edit " + d.title}
                >
                  <div aria-hidden="true">
                    <Paper resume={d.resume} />
                  </div>
                </a>
                <div className="doc-info">
                  <a href={"#/edit/" + d.id}>
                    <h3>{d.title}</h3>
                  </a>
                  <small>
                    Edited {new Date(d.updated).toLocaleDateString()}
                  </small>
                  <div className="doc-actions">
                    <button
                      onClick={() => {
                        const title = prompt("Resume name", d.title)?.trim();
                        if (title) save({ ...d, title, updated: Date.now() });
                      }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() =>
                        save({
                          ...d,
                          id: crypto.randomUUID(),
                          title: d.title + " (copy)",
                          updated: Date.now(),
                        })
                      }
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setSource(d);
                        setJobTitle("");
                        setDescription("");
                        requestAnimationFrame(() =>
                          document
                            .querySelector(".version-form")
                            ?.scrollIntoView({ block: "center" }),
                        );
                      }}
                    >
                      Create job version
                    </button>
                    <button onClick={() => backup(d)}>Backup</button>
                    <button
                      onClick={() => {
                        if (
                          confirm("Delete " + d.title + " from this browser?")
                        )
                          remove(d.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="privacy">
          Drafts are saved on this device. Keep a JSON backup before clearing
          browser data.
        </p>
      </section>
    </main>
  );
}
