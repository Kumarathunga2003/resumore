import { FormattedField } from "./FormattedField";
import type { Entry, Section } from "./model";
const fields: Record<string, string[]> = {
  experience: ["Job title", "Company", "Location", "Dates", "Employment type"],
  education: ["Degree", "Institution", "Location", "Dates", "GPA or grade"],
  projects: [
    "Project name",
    "Role",
    "Technologies",
    "Dates",
    "Repository or project URL",
    "Live demo URL",
  ],
  skills: ["Skill category", "Skills"],
};
export function Entries({
  section,
  onChange,
}: {
  section: Section;
  onChange: (entries: Entry[]) => void;
}) {
  const entries = section.entries || [];
  const labels = fields[section.id] || ["Title", "Organization", "Dates"];
  function update(id: string, changes: Partial<Entry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...changes } : e)));
  }
  function move(from: number, to: number) {
    const next = [...entries];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  }
  return (
    <div className="entries">
      {entries.map((e, i) => (
        <fieldset key={e.id}>
          <legend>
            {section.id === "projects"
              ? e.values[0] || "New project"
              : "Entry " + (i + 1)}
          </legend>
          {labels.map((l, j) => (
            <label className="field" key={l}>
              {l}
              <input
                value={e.values[j] || ""}
                onChange={(ev) => {
                  const values = Array.from(
                    { length: labels.length },
                    (_, idx) =>
                      idx === j ? ev.target.value : e.values[idx] || "",
                  );
                  update(e.id, { values });
                }}
              />
            </label>
          ))}
          <FormattedField
            id={"entry-bullets-" + e.id}
            passageId={JSON.stringify([section.id, e.id])}
            label={
              section.id === "projects"
                ? "Your contribution"
                : "Achievements or details"
            }
            value={e.bullets}
            marks={e.marks}
            block={e.block}
            defaultList="bullet"
            setBlock={(block) => update(e.id, { block })}
            rows={3}
            change={(bullets, marks) => update(e.id, { bullets, marks })}
          />
          <div className="doc-actions">
            <button disabled={!i} onClick={() => move(i, i - 1)}>
              Move earlier
            </button>
            <button
              disabled={i === entries.length - 1}
              onClick={() => move(i, i + 1)}
            >
              Move later
            </button>
            <button
              onClick={() =>
                onChange([
                  ...entries.slice(0, i + 1),
                  { ...e, id: crypto.randomUUID() },
                  ...entries.slice(i + 1),
                ])
              }
            >
              Copy entry
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this entry?"))
                  onChange(entries.filter((x) => x.id !== e.id));
              }}
            >
              Delete entry
            </button>
          </div>
        </fieldset>
      ))}
      <button
        className="add-section"
        onClick={() =>
          onChange([
            ...entries,
            { id: crypto.randomUUID(), values: [], bullets: "" },
          ])
        }
      >
        {section.id === "projects" ? "Add project card" : "Add entry"}
      </button>
    </div>
  );
}
