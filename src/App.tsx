import { Assistant } from "./Assistant";
import { withTemplate } from "./templates";
import {
  WorkspaceSettings,
  workspaceVars,
  loadWorkspace,
  type WorkspaceStyle,
} from "./WorkspaceSettings";
import { useEffect, useRef, useState } from "react";
import { Landing } from "./Landing";
import { Dashboard } from "./Dashboard";
import Editor from "./Editor";
import { backup, draft, type Draft, type Resume } from "./model";
import { loadDrafts, persist } from "./storage";
import "./studio.css";
function currentRoute() {
  return location.hash.startsWith("#/") ? location.hash.slice(1) : "/";
}
export default function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace);
  function changeWorkspace(v: WorkspaceStyle) {
    setWorkspace(v);
    try {
      localStorage.setItem("resumora-workspace", JSON.stringify(v));
    } catch {
      report("Workspace settings will last for this session.");
    }
  }
  const [route, navigate] = useState(currentRoute),
    [docs, setDocs] = useState<Draft[]>([]),
    [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Saved locally"),
    [error, report] = useState("");
  const current = useRef<Draft[]>([]),
    ticket = useRef(0),
    pending = useRef(0),
    failed = useRef(new Set<string>());
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("resumora-theme") || "system";
    } catch {
      return "system";
    }
  });
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme:dark)").matches,
  );
  useEffect(() => {
    let active = true;
    loadDrafts()
      .then((d) => {
        if (active) {
          current.current = d;
          setDocs(d);
        }
      })
      .catch(() => {
        if (active)
          report(
            "Browser storage unavailable. Export a JSON backup before closing.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const routeChange = () => {
      navigate(currentRoute());
      if (location.hash.startsWith("#/")) scrollTo(0, 0);
    };
    const mq = matchMedia("(prefers-color-scheme:dark)"),
      change = () => setSystemDark(mq.matches);
    const leave = (e: BeforeUnloadEvent) => {
      if (pending.current || failed.current.size) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("hashchange", routeChange);
    mq.addEventListener("change", change);
    return () => {
      active = false;
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("hashchange", routeChange);
      mq.removeEventListener("change", change);
    };
  }, []);
  function write(record: Draft | string) {
    const id = typeof record === "string" ? record : record.id;
    if (typeof record !== "string") {
      current.current = [...current.current.filter((d) => d.id !== id), record];
      setDocs([...current.current]);
    }
    const seq = ++ticket.current;
    pending.current++;
    setStatus("Saving…");
    persist(record)
      .then(() => {
        if (typeof record === "string") {
          current.current = current.current.filter((d) => d.id !== id);
          setDocs([...current.current]);
        }
        failed.current.delete(id);
        if (seq === ticket.current) setStatus("Saved locally");
        if (!failed.current.size) report("");
      })
      .catch(() => {
        failed.current.add(id);
        setStatus("Save failed");
        report(
          "Could not save the latest change. Export a JSON backup before leaving.",
        );
      })
      .finally(() => pending.current--);
  }
  function create(sample = false, template?: string) {
    const d = draft(sample);
    if (template) d.resume = withTemplate(d.resume, template);
    write(d);
    location.hash = "/edit/" + d.id;
  }
  useEffect(() => {
    if (ready && route === "/new-creative") create(false, "minimal");
  }, [ready, route]);
  const doc = docs.find((d) => route === "/edit/" + d.id);
  const themeControl = (
    <select
      aria-label="Interface theme"
      className="theme"
      value={theme}
      onChange={(e) => {
        setTheme(e.target.value);
        try {
          localStorage.setItem("resumora-theme", e.target.value);
        } catch {
          /* Preference is optional. */
        }
      }}
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
  const appearance = (
    <WorkspaceSettings
      value={workspace}
      change={changeWorkspace}
      theme={themeControl}
    />
  );
  function edit(update: React.SetStateAction<Resume>) {
    const latest = current.current.find((d) => d.id === doc?.id);
    if (!latest) return;
    write({
      ...latest,
      updated: Date.now(),
      resume: typeof update === "function" ? update(latest.resume) : update,
    });
  }
  return (
    <div
      style={workspaceVars(workspace)}
      data-surface={workspace.surface}
      data-size={workspace.size}
      data-density={workspace.density}
      className={
        "app " +
        (theme === "dark" || (theme === "system" && systemDark) ? "dark" : "")
      }
    >
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {!ready ? (
        <p role="status">Opening studio…</p>
      ) : doc ? (
        <Editor
          workspaceSettings={appearance}
          key={doc.id}
          resume={doc.resume}
          setResume={edit}
          title={doc.title}
          rename={(title) => {
            const latest = current.current.find((d) => d.id === doc.id);
            if (latest) write({ ...latest, title, updated: Date.now() });
          }}
          status={status}
          onBackup={() => backup(doc)}
        />
      ) : route === "/" ? (
        <Landing create={create} theme={appearance} />
      ) : (
        <Dashboard
          docs={docs}
          save={write}
          remove={write}
          create={create}
          theme={appearance}
        />
      )}
      {ready && !doc && <Assistant key={route} create={() => create()} />}
    </div>
  );
}
