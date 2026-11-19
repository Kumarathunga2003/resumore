import { useState } from "react";
import {
  designOf,
  initial,
  sizeControls,
  validResume,
  type Resume,
} from "./model";
type Design = ReturnType<typeof designOf>;
const prefix = "resumora-style-v1:";
const builtIns: Record<string, Design> = {
  "Classic ATS": { ...designOf(initial), font: "Arial" },
  "Graduate Compact": {
    ...designOf(initial),
    density: "compact",
    bodySize: 12,
    lineHeight: 1.4,
  },
  "Editorial Serif": {
    ...designOf(initial),
    mode: "creative",
    font: "Georgia",
    accent: "#5545ac",
    density: "relaxed",
    nameSize: 36,
    bodySize: 13,
  },
};
function savedDesigns() {
  const saved = new Map<string, Design>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      try {
        const raw = JSON.parse(localStorage.getItem(key) ?? "null");
        if (!raw || typeof raw !== "object") continue;
        const candidate = { ...initial, ...raw };
        if (validResume(candidate))
          saved.set(key.slice(prefix.length), designOf(candidate));
      } catch {
        /* An unreadable preset does not affect the others. */
      }
    }
  } catch {
    /* Built-in presets remain available if storage is disabled. */
  }
  return saved;
}
export function DesignControls({
  resume,
  apply,
}: {
  resume: Resume;
  apply: (d: Partial<Design>) => void;
}) {
  const [saved, setSaved] = useState(savedDesigns),
    [selected, select] = useState("built:Classic ATS"),
    [name, setName] = useState(""),
    [notice, notify] = useState("");
  const custom = selected.startsWith("own:");
  const label = selected.slice(custom ? 4 : 6);
  const style = custom ? saved.get(label) : builtIns[label];
  function save() {
    const title = name.trim();
    if (!title) return;
    try {
      const key = prefix + title;
      if (
        localStorage.getItem(key) !== null &&
        !confirm("Replace the saved preset “" + title + "”?")
      )
        return;
      localStorage.setItem(key, JSON.stringify(designOf(resume)));
      setSaved(savedDesigns());
      select("own:" + title);
      setName("");
      notify("Preset saved on this device.");
    } catch {
      notify(
        "This browser could not store the preset. Your resume still has its current design.",
      );
    }
  }
  function remove() {
    if (!custom || !confirm("Delete the saved preset “" + label + "”?")) return;
    try {
      localStorage.removeItem(prefix + label);
      setSaved(savedDesigns());
      select("built:Classic ATS");
      notify("Preset deleted.");
    } catch {
      notify("Could not delete this preset.");
    }
  }
  return (
    <div className="advanced-design">
      <h3>Page design</h3>
      <label className="field">
        Header alignment
        <select
          value={designOf(resume).headerAlign}
          onChange={(e) =>
            apply({ headerAlign: e.target.value as Resume["headerAlign"] })
          }
        >
          {["left", "center", "right"].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="ink-tools" disabled={resume.mode === "ats"}>
        <legend>Creative colors</legend>
        {(
          [
            ["accent", "Headings"],
            ["textColor", "Body text"],
            ["ruleColor", "Divider lines"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="color"
              value={designOf(resume)[key]}
              onChange={(e) => apply({ [key]: e.target.value })}
            />
          </label>
        ))}
      </fieldset>
      <h3>Fonts and spacing</h3>
      {(Object.keys(sizeControls) as (keyof typeof sizeControls)[]).map(
        (key) => {
          const c = sizeControls[key],
            v = resume[key] ?? c.initial;
          return (
            <label className="type-range" key={key}>
              <span>
                {c.label}
                <output>
                  {v}
                  {c.unit}
                </output>
              </span>
              <input
                type="range"
                aria-label={c.label}
                min={c.min}
                max={c.max}
                step={c.step}
                value={v}
                onChange={(e) => apply({ [key]: Number(e.target.value) })}
              />
            </label>
          );
        },
      )}
      <h3>Saved designs</h3>
      <label className="field-label" htmlFor="style-preset">
        Choose a preset
      </label>
      <select
        id="style-preset"
        value={selected}
        onChange={(e) => select(e.target.value)}
      >
        <optgroup label="Studio presets">
          {Object.keys(builtIns).map((n) => (
            <option key={n} value={"built:" + n}>
              {n}
            </option>
          ))}
        </optgroup>
        {!!saved.size && (
          <optgroup label="My presets">
            {Array.from(saved.keys())
              .sort()
              .map((n) => (
                <option key={n} value={"own:" + n}>
                  {n}
                </option>
              ))}
          </optgroup>
        )}
      </select>
      <div className="doc-actions">
        <button
          disabled={!style}
          onClick={() => {
            if (style) {
              apply(style);
              notify(label + " applied.");
            }
          }}
        >
          Apply preset
        </button>
        {custom && <button onClick={remove}>Delete preset</button>}
      </div>
      <label className="field">
        Save current design as
        <input
          value={name}
          maxLength={60}
          placeholder="e.g. Internship applications"
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button className="btn outline" disabled={!name.trim()} onClick={save}>
        Save preset
      </button>
      <p role="status">{notice}</p>
    </div>
  );
}
