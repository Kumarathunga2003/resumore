import type { Resume } from "./model";
const stop = new Set(
  "the and for with this that your will have from are our experience years work role candidate looking team required including you ability about excellent skills strong responsibilities qualifications working seeking successful their across within using related join must preferred a an at be is it of on or as by in to we us they he she all key who can able need needs has our company job apply please knowledge familiarity proficient proficiency year minimum at least including such use used responsibilities looking understanding familiarity proven good hands opportunity".split(
    " ",
  ),
);
function terms(s: string) {
  s = s
    .replace(/\bnode[ .]?js\b/gi, "nodejs")
    .replace(/\breact[ .]?js\b/gi, "react")
    .replace(/\bjs\b/gi, "javascript")
    .replace(/\bts\b/gi, "typescript")
    .replace(/\.net\b/gi, "dotnet")
    .replace(/\bpower[ -]?bi\b/gi, "power-bi")
    .replace(/\bversion[ -]control\b/gi, "version-control")
    .replace(/\bmachine[ -]learning\b/gi, "machine-learning");
  return (s.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]*/gu) || []).map(
    (t) => t.replace(/[.-]+$/g, ""),
  );
}
export function analyze(r: Resume, job: string) {
  const sections = r.sections
    .filter((s) => s.enabled)
    .map((s) => ({
      id: s.id,
      text: [
        s.content,
        ...(s.entries || []).flatMap((e) => [...e.values, e.bullets]),
      ]
        .join(" ")
        .trim(),
    }));
  const tips: string[] = [];
  if (!r.name.trim()) tips.push("Add your full name at the top of the resume.");
  if (
    r.hiddenContacts?.includes("email") ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)
  )
    tips.push("Show a complete email address so recruiters can contact you.");
  if (
    !sections.some((s) => ["experience", "projects"].includes(s.id) && s.text)
  )
    tips.push(
      "Describe a project or work experience, including your contribution.",
    );
  if (!sections.some((s) => s.id === "education" && s.text))
    tips.push("Add your education or relevant training.");
  if (!r.role.trim())
    tips.push("Add the job title or field you want under your name.");
  if (!r.summary.trim())
    tips.push(
      "Write a short summary. Mention your field and one project or skill.",
    );
  if (!sections.some((s) => s.id === "skills" && s.text))
    tips.push("List two or three skills you have used in class or at work.");
  const project = r.sections.find((s) => s.enabled && s.id === "projects");
  if (project?.entries?.some((e) => e.values[0]?.trim() && !e.bullets.trim()))
    tips.push(
      "For each named project, add one sentence about what you built or tested.",
    );
  if (terms(r.summary).length > 100)
    tips.push("Consider shortening the summary to a few focused sentences.");
  if (r.mode === "creative")
    tips.push(
      "For applications that request plain formatting, try Strict ATS mode.",
    );
  const tokens = new Set(
    terms([r.role, r.summary, ...sections.map((s) => s.text)].join(" ")),
  );
  const keywords = [
    ...new Set(
      terms(job).filter(
        (t) =>
          (t.length > 1 || t === "c" || t === "r") &&
          !stop.has(t) &&
          !/^\d+$/.test(t),
      ),
    ),
  ];
  return {
    tips,
    matched: keywords.filter((k) => tokens.has(k)),
    missing: keywords.filter((k) => !tokens.has(k)),
    count: keywords.length,
  };
}

function oneLetterApart(a: string, b: string) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length > b.length) return oneLetterApart(b, a);
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length !== b.length) return a.slice(i) === b.slice(i + 1);
  return (
    a.slice(i + 1) === b.slice(i + 1) ||
    (a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2))
  );
}

// Near matches are prompts to review, never evidence for the keyword score.
export function keywordHints(r: Resume, missing: string[]) {
  const text = [
    r.role,
    r.summary,
    ...r.sections
      .filter((s) => s.enabled)
      .flatMap((s) => [
        s.content,
        ...(s.entries ?? []).flatMap((e) => [...e.values, e.bullets]),
      ]),
  ].join(" ");
  const words = new Set(terms(text).filter((w) => w.length >= 4));
  const hints: { wanted: string; written: string }[] = [];
  for (const wanted of missing) {
    if (wanted.length < 5) continue;
    const written = Array.from(words).find((word) =>
      oneLetterApart(word, wanted),
    );
    if (written) hints.push({ wanted, written });
    if (hints.length === 5) break;
  }
  return hints;
}
