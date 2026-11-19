import { passages, writingSuggestions } from "./writing";
import { Assistant } from "./Assistant";
import { PdfPreview } from "./PdfPreview";
import { PhotoControls } from "./Portrait";
import { TemplateGallery } from "./TemplateGallery";
import { withTemplate } from "./templates";
import { FormattingDock } from "./FormattingDock";
import { FormattedField } from "./FormattedField";
import { downloadResume } from "./pdf";
import { DesignControls } from "./DesignControls";
import { contactLabels, type ContactKey } from "./model";
import { Entries } from "./Entries";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Layers3,
  LayoutTemplate,
  Palette,
  Plus,
  ShieldCheck,
  Trash2,
} from "./Icons";
import { Brand } from "./Brand";
import { Paper } from "./Paper";
import type { Resume, Section } from "./model";
import "./App.css";
function Editor({
  resume,
  setResume: commit,
  status,
  title,
  rename,
  onBackup,
  workspaceSettings,
}: {
  resume: Resume;
  setResume: Dispatch<SetStateAction<Resume>>;
  status: string;
  title: string;
  rename: (name: string) => void;
  onBackup: () => void;
  workspaceSettings: React.ReactNode;
}) {
  const [titleText, setTitleText] = useState(title);
  const fields = useMemo(() => passages(resume), [resume]);
  const suggestions = useMemo(() => writingSuggestions(fields), [fields]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const visible = useMemo(() => suggestions.filter(s => !ignored.includes(s.key)), [suggestions, ignored]);
  const history = useRef<{ past: Resume[]; future: Resume[] }>({
    past: [],
    future: [],
  });
  function setResume(change: SetStateAction<Resume>) {
    const next = typeof change === "function" ? change(resume) : change;
    if (next === resume) return;
    history.current.past = [...history.current.past.slice(-99), resume];
    history.current.future = [];
    commit(next);
  }
  function restore(direction: "past" | "future") {
    const target = history.current[direction].pop();
    if (!target) return;
    history.current[direction === "past" ? "future" : "past"].push(resume);
    commit(target);
    if (active !== "profile" && !target.sections.some((s) => s.id === active))
      setActive("profile");
  }
  const [active, setActive] = useState("profile");
  const [appearance, setAppearance] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionsTrigger = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    backButton.current?.focus({ preventScroll: true });
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("dialog[open], [role=dialog]:not([hidden])")) {
        setSidebarOpen(false);
        sectionsTrigger.current?.focus();
      }
    }
    const phone = matchMedia("(max-width: 650px)");
    const onResize = () => { if (!phone.matches) setSidebarOpen(false); };
    phone.addEventListener("change", onResize);
    window.addEventListener("keydown", onEscape);
    return () => {
      phone.removeEventListener("change", onResize);
      window.removeEventListener("keydown", onEscape);
    };
  }, [sidebarOpen]);
  const [preview, setPreview] = useState(false);

  const [view, setView] = useState<"live" | "edit" | "pages">("live");
  const [zoom, setZoom] = useState(100);

  const section = useMemo(
    () => resume.sections.find((s) => s.id === active),
    [resume.sections, active],
  );
  const patch = <K extends keyof Resume>(field: K, value: Resume[K]) =>
    setResume((prev) => ({ ...prev, [field]: value }));
  const editSection = (id: string, changes: Partial<Section>) =>
    setResume((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, ...changes } : s,
      ),
    }));
  const move = (id: string, direction: number) =>
    setResume((prev) => {
      const sections = [...prev.sections];
      const from = sections.findIndex((s) => s.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= sections.length) return prev;
      [sections[from], sections[to]] = [sections[to], sections[from]];
      return { ...prev, sections };
    });
  const addSection = () => {
    const id = `custom-${Date.now()}`;
    setResume((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id, label: "Custom Section", content: "", enabled: true },
      ],
    }));
    setAppearance(false);
    setPreview(false);
    setActive(id);
    setSidebarOpen(false);
  };
  const selectSection = (id: string) => {
    setActive(id);
    setPreview(false);
    setAppearance(false);
    setSidebarOpen(false);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !(e.ctrlKey || e.metaKey) ||
        e.altKey ||
        !["z", "y"].includes(e.key.toLowerCase())
      )
        return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "[data-coach-answer],.doc-title,.ribbon-wrap,.workspace-settings,[role=dialog]",
        )
      )
        return;
      e.preventDefault();
      restore(e.key.toLowerCase() === "y" || e.shiftKey ? "future" : "past");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState("");
  async function download() {
    setExporting(true);
    setExportError("");
    try {
      await downloadResume(resume, title);
    } catch {
      setExportError("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [activeField, activate] = useState("");
  const [fit, setFit] = useState(0.6);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!stage.current) return;
    const obs = new ResizeObserver(([e]) => {
      if (e.contentRect.width > 0)
        setFit(
          Math.min(
            1,
            e.contentRect.width / (resume.paper === "Letter" ? 816 : 794),
          ),
        );
    });
    obs.observe(stage.current);
    return () => obs.disconnect();
  }, [resume.paper]);
  return (
    <FormattingDock.Provider
      value={{
        host,
        suggestions: visible,
        active: activeField,
        undo: () => restore("past"),
        redo: () => restore("future"),
        canUndo: history.current.past.length > 0,
        canRedo: history.current.future.length > 0,
        activate,
        font: resume.font,
        size: Math.round((resume.bodySize ?? 11.5) * 0.75),
      }}
    >
      <div
        className={
          "studio " +
          (preview ? "show-preview" : "") +
          (view === "edit" ? " canvas-mode" : "")
        }
      >
        <style>
          {"@media print{@page{size:" +
            (resume.paper === "Letter" ? "letter" : "A4") +
            ";margin:15mm}}"}
        </style>
        <header className="topbar">
          <Brand />
          <a href="#/workspace" className="back">
            My resumes
          </a>
          <input
            className="doc-title"
            aria-label="CV name"
            title="Edit CV name"
            maxLength={160}
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            onBlur={() => {
              const next = titleText.trim() || title;
              setTitleText(next);
              if (next !== title) rename(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitleText(title);
                e.preventDefault();
              }
            }}
          />
          <span role="status" className="save-status">
            {status}
          </span>
          {workspaceSettings}
          <button
            disabled={exporting}
            className="button button-primary"
            onClick={download}
          >
            {exporting ? "Preparing PDF" : "Download PDF"}
          </button>
        </header>
        {exportError && <p role="alert">{exportError}</p>}
        <div className="mobile-tabs">
          <button
            ref={sectionsTrigger}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-expanded={sidebarOpen}
            aria-controls="resume-sections"
          >
            {sidebarOpen ? "Close sections" : "Sections"}
          </button>
          <button aria-pressed={!preview} onClick={() => { setSidebarOpen(false); setPreview(false); }}>
            Edit
          </button>
          <button aria-pressed={preview} onClick={() => { setSidebarOpen(false); setPreview(true); }}>
            Preview
          </button>
        </div>
        <div className="workspace">
          <aside id="resume-sections" aria-label="Resume sections" className={`sidebar ${sidebarOpen ? "show" : ""}`}>
            <div className="mobile-section-heading">
              <strong>Sections</strong>
              <button ref={backButton} type="button" onClick={() => {
                setSidebarOpen(false);
                sectionsTrigger.current?.focus();
              }}>Back to {preview ? "preview" : "editor"}</button>
            </div>
            <div className="sidebar-top">
              <div className="eyebrow">WORKSPACE</div>
              <h2>Your resume</h2>
              <p>Content & layout</p>
            </div>
            <button
              className="nav-entry active-profile"
              data-active={active === "profile" && !appearance}
              onClick={() => selectSection("profile")}
            >
              <div className="nav-icon">
                <FileText size={17} />
              </div>
              <span>Personal details</span>
            </button>
            <div className="nav-group-heading">
              RESUME SECTIONS{" "}
              <span>{resume.sections.filter((s) => s.enabled).length}</span>
            </div>
            <div className="section-links">
              {resume.sections.map((s) => (
                <button
                  key={s.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("application/resumora-section", s.id)
                  }
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData(
                      "application/resumora-section",
                    );
                    const from = resume.sections.findIndex(
                      (item) => item.id === id,
                    );
                    if (from >= 0) move(id, resume.sections.indexOf(s) - from);
                  }}
                  className="nav-entry"
                  data-active={active === s.id && !appearance}
                  onClick={() => selectSection(s.id)}
                >
                  <div className="nav-icon">
                    {s.id === "education" ? (
                      <GraduationCap size={17} />
                    ) : s.id === "experience" ? (
                      <BriefcaseBusiness size={17} />
                    ) : (
                      <Layers3 size={17} />
                    )}
                  </div>
                  <span>{s.label}</span>
                  {!s.enabled && (
                    <span className="off-dot" title="Hidden in preview" />
                  )}
                </button>
              ))}
            </div>
            <button className="add-section" onClick={addSection}>
              Add custom section
            </button>
            <div className="sidebar-bottom">
              <button
                className="nav-entry"
                data-active={appearance}
                onClick={() => {
                  setAppearance(true);
                  setPreview(false);
                  setSidebarOpen(false);
                }}
              >
                <div className="nav-icon">
                  <Palette size={17} />
                </div>
                <span>Design & appearance</span>
              </button>
              <div className="tip">
                <div>
                  <b>Choosing a format</b>
                  <p>Switch to ATS mode for a simpler, text-first layout.</p>
                </div>
              </div>
            </div>
          </aside>
          <div className="workspace-body">
            <div className="preview-tools" hidden={view === "pages"}>
              <button
                disabled={zoom <= 50}
                aria-label="Decrease zoom"
                title="Decrease zoom"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Fit preview to width"
                title="Fit to width"
                onClick={() => setZoom(100)}
              >
                {zoom}%
              </button>
              <button
                disabled={zoom >= 150}
                aria-label="Increase zoom"
                title="Increase zoom"
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
              >
                +
              </button>
            </div>
            <div className="format-dock" ref={setHost} />
            <div className="workspace-panes">
              <main className="edit-panel">
                <div className="panel-heading">
                  <h1>
                    {appearance
                      ? "Design & appearance"
                      : active === "profile"
                        ? "Personal details"
                        : (section?.label ?? "Resume section")}
                  </h1>
                  <p>
                    {appearance
                      ? "Choose the fonts, colors, and spacing for your CV."
                      : active === "profile"
                        ? "Add the details you want at the top of your CV."
                        : "Edit this section and arrange it in the order you prefer."}
                  </p>
                </div>
                {appearance ? (
                  <div className="edit-card">
                    <h3>
                      <LayoutTemplate size={18} /> CV templates
                    </h3>
                    <TemplateGallery
                      resume={resume}
                      choose={(id) => setResume((r) => withTemplate(r, id))}
                    />
                    <h3>Resume mode</h3>
                    <div className="mode-choice">
                      <button
                        data-selected={resume.mode === "ats"}
                        onClick={() => patch("mode", "ats")}
                      >
                        <b>ATS Mode</b>
                        <span>Clean, single-column and simple.</span>
                      </button>
                      <button
                        data-selected={resume.mode === "creative"}
                        onClick={() => patch("mode", "creative")}
                      >
                        <b>Creative Mode</b>
                        <span>Add color and choose a layout.</span>
                      </button>
                    </div>
                    <label className="field-label" htmlFor="font">
                      Typeface
                    </label>
                    <select
                      id="font"
                      value={resume.font}
                      onChange={(e) => patch("font", e.target.value)}
                    >
                      <option>Plus Jakarta Sans</option>
                      <option value="Inter">System font</option>
                      <option>Georgia</option>
                      <option>Arial</option>
                    </select>
                    <label className="field-label" htmlFor="paper">
                      Paper size
                    </label>
                    <select
                      id="paper"
                      value={resume.paper || "A4"}
                      onChange={(e) =>
                        patch("paper", e.target.value as Resume["paper"])
                      }
                    >
                      <option>A4</option>
                      <option value="Letter">US Letter</option>
                    </select>
                    <label className="field-label" htmlFor="density">
                      Section spacing
                    </label>
                    <select
                      id="density"
                      value={resume.density || "normal"}
                      onChange={(e) =>
                        patch("density", e.target.value as Resume["density"])
                      }
                    >
                      <option value="compact">Compact</option>
                      <option value="normal">Standard</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                    <div className="field-label">
                      Accent color{" "}
                      <small>
                        {resume.mode === "ats" ? "(Creative mode only)" : ""}
                      </small>
                    </div>
                    <div className="swatches">
                      {[
                        "#5545ac",
                        "#2563eb",
                        "#7c3aed",
                        "#be6a38",
                        "#232a35",
                      ].map((color) => (
                        <button
                          key={color}
                          disabled={resume.mode === "ats"}
                          className="swatch"
                          style={{ background: color }}
                          aria-label={`Select ${color}`}
                          title={color}
                          data-selected={resume.accent === color}
                          onClick={() => patch("accent", color)}
                        ></button>
                      ))}
                    </div>
                    <DesignControls
                      resume={resume}
                      apply={(design) =>
                        setResume((prev) => ({ ...prev, ...design }))
                      }
                    />
                    <div className="note">
                      <CircleHelp size={17} />
                      <span>
                        ATS mode ignores decorative colors. No template can
                        guarantee compatibility with every employer’s ATS.
                      </span>
                    </div>
                  </div>
                ) : active === "profile" ? (
                  <div className="edit-card">
                    <div className="card-heading">
                      <h3>Personal information</h3>
                    </div>
                    <PhotoControls
                      photo={resume.photo}
                      change={(photo) => patch("photo", photo)}
                    />
                    <div className="field">
                      <label htmlFor="full-name">Full name</label>
                      <input
                        id="full-name"
                        value={resume.name}
                        onChange={(e) => patch("name", e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="role">Professional headline</label>
                      <input
                        id="role"
                        value={resume.role}
                        onChange={(e) => patch("role", e.target.value)}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div className="field-grid">
                      <div className="field">
                        <label htmlFor="email">Email address</label>
                        <input
                          id="email"
                          type="email"
                          value={resume.email}
                          onChange={(e) => patch("email", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="phone">Phone number</label>
                        <input
                          id="phone"
                          value={resume.phone}
                          onChange={(e) => patch("phone", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="field-grid">
                      <div className="field">
                        <label htmlFor="location">Location</label>
                        <input
                          id="location"
                          value={resume.location}
                          onChange={(e) => patch("location", e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="website">
                          Website or existing link
                        </label>
                        <input
                          id="website"
                          value={resume.website}
                          onChange={(e) => patch("website", e.target.value)}
                        />
                      </div>
                    </div>
                    <details className="advanced-options">
                      <summary>Links and contact details</summary>
                      {(["linkedin", "github", "portfolio"] as const).map(
                        (key) => (
                          <label className="field" key={key}>
                            {contactLabels[key]} URL
                            <input
                              type="url"
                              value={resume[key] ?? ""}
                              onChange={(e) => patch(key, e.target.value)}
                              placeholder="https://"
                            />
                          </label>
                        ),
                      )}
                      <fieldset>
                        <legend>Show on resume</legend>
                        <div className="visibility-options">
                          {(Object.keys(contactLabels) as ContactKey[]).map(
                            (key) => (
                              <label key={key}>
                                <input
                                  type="checkbox"
                                  checked={
                                    !resume.hiddenContacts?.includes(key)
                                  }
                                  onChange={(e) =>
                                    patch(
                                      "hiddenContacts",
                                      e.target.checked
                                        ? (resume.hiddenContacts ?? []).filter(
                                            (k) => k !== key,
                                          )
                                        : [
                                            ...(resume.hiddenContacts ?? []),
                                            key,
                                          ],
                                    )
                                  }
                                />
                                {contactLabels[key]}
                              </label>
                            ),
                          )}
                        </div>
                      </fieldset>
                    </details>
                    <div className="card-divider" />
                    <div className="card-heading">
                      <h3>Professional summary</h3>
                    </div>
                    <FormattedField
                      id="summary"
                      label="Your introduction"
                      value={resume.summary}
                      marks={resume.summaryMarks}
                      block={resume.summaryBlock}
                      setBlock={(summaryBlock) =>
                        setResume((prev) => ({ ...prev, summaryBlock }))
                      }
                      change={(summary, summaryMarks) =>
                        setResume((prev) => ({
                          ...prev,
                          summary,
                          summaryMarks,
                        }))
                      }
                    />
                    <p className="help-text">
                      Focus on what you do, your experience, and the value you
                      bring.
                    </p>
                  </div>
                ) : section ? (
                  <div className="edit-card">
                    <div className="field">
                      <label htmlFor="section-label">Section heading</label>
                      <input
                        id="section-label"
                        value={section.label}
                        onChange={(e) =>
                          editSection(section.id, { label: e.target.value })
                        }
                      />
                    </div>
                    <FormattedField
                      key={section.id}
                      id="section-content"
                      passageId={JSON.stringify([section.id])}
                      label="Content"
                      value={section.content}
                      marks={section.marks}
                      block={section.block}
                      setBlock={(block) => editSection(section.id, { block })}
                      change={(content, marks) =>
                        editSection(section.id, { content, marks })
                      }
                    />
                    <Entries
                      section={section}
                      onChange={(entries) =>
                        editSection(section.id, { entries })
                      }
                    />
                    <div className="section-controls">
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={(e) =>
                            editSection(section.id, {
                              enabled: e.target.checked,
                            })
                          }
                        />{" "}
                        Show in resume
                      </label>
                      <div>
                        <button
                          className="small-button"
                          title="Move up"
                          onClick={() => move(section.id, -1)}
                        >
                          Move earlier
                        </button>
                        <button
                          className="small-button"
                          title="Move down"
                          onClick={() => move(section.id, 1)}
                        >
                          Move later
                        </button>
                        {section.id.startsWith("custom-") && (
                          <button
                            className="small-button danger"
                            title="Delete section"
                            onClick={() => {
                              if (!confirm("Delete this section and its text?"))
                                return;
                              setResume((prev) => ({
                                ...prev,
                                sections: prev.sections.filter(
                                  (s) => s.id !== section.id,
                                ),
                              }));
                              setActive("profile");
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="editor-footer">
                  <span>
                    <ShieldCheck size={15} /> Your draft stays in this browser.
                  </span>
                  <button onClick={onBackup}>
                    <Download size={15} /> JSON backup
                  </button>
                </div>
              </main>
              <aside className="preview-panel">
                <div className="preview-toolbar">
                  <div>
                    Live preview{" "}
                    <span className="preview-badge">
                      {resume.mode === "ats" ? "ATS MODE" : "CREATIVE MODE"}
                    </span>
                  </div>
                </div>
                <div className="preview-modes" aria-label="Preview mode">
                  {(["live", "edit", "pages"] as const).map((mode, i) => (
                    <button
                      key={mode}
                      aria-pressed={view === mode}
                      onClick={() => {
                        setView(mode);
                        activate("");
                      }}
                    >
                      {["Live preview", "Edit on CV", "Page breaks"][i]}
                    </button>
                  ))}
                </div>
                <div className="page-stage" ref={stage}>
                  {view === "pages" ? (
                    <PdfPreview resume={resume} title={title} />
                  ) : (
                    <div
                      className="page-viewport"
                      style={{
                        width: resume.paper === "Letter" ? 816 : 794,
                        zoom: (fit * zoom) / 100,
                      }}
                    >
                      <Paper
                        resume={resume}
                        interactive
                        update={view === "edit" ? setResume : undefined}
                        onTextSelect={
                          view === "edit"
                            ? undefined
                            : (sectionId, fieldId, start, end) => {
                                selectSection(sectionId);
                                requestAnimationFrame(() => {
                                  const input =
                                    document.getElementById(fieldId);
                                  if (input instanceof HTMLTextAreaElement) {
                                    input.focus({ preventScroll: true });
                                    input.setSelectionRange(start, end);
                                  }
                                });
                              }
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="preview-hint">{resume.paper || "A4"} paper</div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Assistant resume={resume} update={setResume} fields={fields} visible={visible} dismiss={key => setIgnored(v => [...v, key])} />
    </FormattingDock.Provider>
  );
}
export default Editor;
