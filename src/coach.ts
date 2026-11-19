import { analyze } from "./analysis.ts";
import type { Resume } from "./model.ts";
export function requirementLines(posting: string) {
  return [
    ...new Set(
      posting
        .split(/(?:\r?\n|[•;]|(?<=[.!?])\s+(?=[A-Z]))+/)
        .map((s) => s.trim().replace(/^[-*]\s+/, ""))
        .filter((s) => s && !s.endsWith(":")),
    ),
  ];
}
export function coachReport(resume: Resume) {
  const posting = resume.jobDescription || "";
  const { matched, missing, count, tips } = analyze(resume, posting);
  return {
    matched,
    missing,
    count,
    tips,
    percentage: count ? Math.round((100 * matched.length) / count) : null,
  };
}
export function evidenceFor(resume: Resume, requirement: string) {
  const fields = [
    { label: "Professional headline", text: resume.role },
    { label: "Professional summary", text: resume.summary },
    ...resume.sections
      .filter((s) => s.enabled)
      .flatMap((s) =>
        [
          s.content,
          ...(s.entries ?? []).map((e) =>
            [...e.values, e.bullets].filter(Boolean).join(" "),
          ),
        ].map((text) => ({ label: s.label, text })),
      ),
  ];
  return fields
    .flatMap((f) =>
      f.text
        .split(/\n+/)
        .filter(Boolean)
        .map((text) => ({
          label: f.label,
          text,
          overlap: analyze(
            { ...resume, role: "", summary: text, sections: [] },
            requirement,
          ).matched.length,
        })),
    )
    .filter((f) => f.overlap)
    .sort((a, b) => b.overlap - a.overlap)[0];
}
export function addExample(r: Resume, id: string, answer: string): Resume {
  const text = answer.trim();
  if (!text) return r;
  const append = (v: string) => (v ? v + "\n" + text : text);
  if (id === ":summary") return { ...r, summary: append(r.summary) };
  if (!r.sections.some((s) => s.id === id && s.enabled)) return r;
  return {
    ...r,
    sections: r.sections.map((s) =>
      s.id === id ? { ...s, content: append(s.content) } : s,
    ),
  };
}
export function exampleFeedback(resume: Resume, line: string, answer: string) {
  const { matched } = analyze(
    { ...resume, role: "", summary: answer, sections: [] },
    line,
  );
  if (!matched.length)
    return "How does your example demonstrate this requirement? Name the relevant tool, skill or qualification if you actually used or earned it.";
  const lead = "Your example mentions " + matched.join(", ") + ". ";
  if (answer.trim().split(/\s+/).length < 7)
    return (
      lead + "What did you personally do with it? Describe one specific task."
    );
  if (
    !/\b(result|resulting|enabled|helped|completed|reduced|increased|improved|delivered|tested|verified|allowed|passed)\b|\d/i.test(
      answer,
    )
  )
    return (
      lead +
      "What changed after your work? Add an outcome you observed or explain how you tested it."
    );
  return (
    lead +
    "Read it once more for accuracy. If you can explain the example in an interview, add it to the section below."
  );
}
