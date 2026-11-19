import { needsSpellingReview, spellingHint } from "./spelling.ts";
import { editMarks } from "./emphasis.ts";
import type { Resume } from "./model.ts";

export type Passage = {
  id: string;
  label: string;
  text: string;
  section?: string;
  entry?: string;
  valueIndex?: number;
};
export function passages(r: Resume): Passage[] {
  const list: Passage[] = [
    { id: "summary", label: "Professional summary", text: r.summary },
    { id: "role", label: "Professional headline", text: r.role },
  ];
  for (const s of r.sections.filter((s) => s.enabled)) {
    list.push({
      id: JSON.stringify([s.id]),
      label: s.label,
      text: s.content,
      section: s.id,
    });
    for (const [i, e] of (s.entries || []).entries()) {
      const indexes =
        s.id === "projects"
          ? [1, 2]
          : s.id === "skills"
            ? [0, 1]
            : ["experience", "education"].includes(s.id)
              ? [0]
              : [];
      for (const j of indexes)
        if (e.values[j]?.trim())
          list.push({
            id: JSON.stringify([s.id, e.id, j]),
            label: s.label + " · " + (e.values[0] || "Entry " + (i + 1)),
            text: e.values[j],
            section: s.id,
            entry: e.id,
            valueIndex: j,
          });
      list.push({
        id: JSON.stringify([s.id, e.id]),
        label: s.label + " · " + (e.values[0] || "Entry " + (i + 1)),
        text: e.bullets,
        section: s.id,
        entry: e.id,
      });
    }
  }
  return list.filter((p) => p.text.trim());
}
const corrections: Record<string, string> = {
  recieve: "receive",
  recieved: "received",
  sucessfully: "successfully",
  experiance: "experience",
  experince: "experience",
  developement: "development",
  managment: "management",
  responsibilites: "responsibilities",
  acheived: "achieved",
  teh: "the",
  adn: "and",
  hte: "the",
  wiht: "with",
  adress: "address",
  adressing: "addressing",
  acheivement: "achievement",
  sucessful: "successful",
  comunication: "communication",
  comunications: "communications",
  enviroment: "environment",
  colaboration: "collaboration",
  oportunity: "opportunity",
  knowlegeable: "knowledgeable",
  profesional: "professional",
  calender: "calendar",
  buisness: "business",
  analisis: "analysis",
  databse: "database",
  responsability: "responsibility",
  writting: "writing",
  progrmming: "programming",
  seperate: "separate",
  proffesional: "professional",
  knowlege: "knowledge",
  implimented: "implemented",
  collabrated: "collaborated",
};
export function issues(text: string) {
  const found: {
    start: number;
    before: string;
    after: string;
    reason: string;
  }[] = [];
  const protectedRanges = Array.from(text.matchAll(/(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w.-]+/gi),
    m => [m.index!, m.index! + m[0].length]);
  function add(
    pattern: RegExp,
    reason: string,
    replacement: (m: RegExpMatchArray) => string,
  ) {
    for (const m of text.matchAll(pattern)) {
      const start = m.index!;
      if (protectedRanges.some(([a,b]) => start < b && a < start + m[0].length)) continue;
      if (
        found.some(
          (x) =>
            start < x.start + x.before.length && x.start < start + m[0].length,
        )
      )
        continue;
      found.push({ start, before: m[0], after: replacement(m), reason });
    }
  }
  const matchCase = (source: string, word: string) =>
    source === source.toUpperCase()
      ? word.toUpperCase()
      : source[0] === source[0].toUpperCase()
        ? word[0].toUpperCase() + word.slice(1)
        : word;
  add(
    new RegExp("\\b(?:" + Object.keys(corrections).join("|") + ")\\b", "gi"),
    "Spelling",
    (m) => matchCase(m[0], corrections[m[0].toLowerCase()]),
  );
  add(
    /\b(the|a|an|to|in|and|of|with|for|my|our)[ \t]+\1\b/gi,
    "Repeated word",
    (m) => m[1],
  );
  add(/\bin order to\b/gi, "Shorter wording", (m) => matchCase(m[0], "to"));
  add(/\bresponsible of\b/gi, "Word choice", (m) =>
    matchCase(m[0], "responsible for"),
  );
  add(/\bI has\b/gi, "Grammar", () => "I have");
  add(/\bwas responsible to manage\b/gi, "Clearer wording", (m) =>
    matchCase(m[0], "managed"),
  );
  // Skip links, email addresses and identifiers when checking ordinary words.
  for (const m of text.matchAll(
    /(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w.-]+|[\w.+#'-]+/g,
  )) {
    if (
      found.some(
        (f) =>
          m.index! < f.start + f.before.length &&
          f.start < m.index! + m[0].length,
      )
    )
      continue;
    const token = m[0].replace(/[.]+$/, "");
    const after = spellingHint(token);
    if (after || needsSpellingReview(token))
      found.push({
        start: m.index!,
        before: token,
        after: after ?? "",
        reason: after ? "Possible spelling mistake" : "Check this word",
      });
  }
  return found.sort((a, b) => a.start - b.start);
}
export function writingSuggestions(fields: Passage[]) {
  return fields.flatMap((p) => {
    const occurrences = new Map<string, number>();
    return issues(p.text).map((i) => {
      const signature = JSON.stringify([p.id, i.before, i.after]);
      const occurrence = occurrences.get(signature) ?? 0;
      occurrences.set(signature, occurrence + 1);
      return { p, i, key: JSON.stringify([signature, occurrence]) };
    });
  });
}
export function revise(
  r: Resume,
  p: Passage,
  next: string,
  caret?: number,
): Resume {
  if (
    next === p.text ||
    !passages(r).some((v) => v.id === p.id && v.text === p.text)
  )
    return r;
  if (p.id === "role") return { ...r, role: next };
  const marks = (m: Resume["summaryMarks"]) =>
    editMarks(p.text, next, m || [], caret);
  if (p.id === "summary")
    return { ...r, summary: next, summaryMarks: marks(r.summaryMarks) };
  return {
    ...r,
    sections: r.sections.map((s) =>
      s.id !== p.section
        ? s
        : p.entry === undefined
          ? { ...s, content: next, marks: marks(s.marks) }
          : {
              ...s,
              entries: s.entries?.map((e) =>
                e.id !== p.entry
                  ? e
                  : p.valueIndex !== undefined
                    ? { ...e, values: e.values.map((v, index) => index === p.valueIndex ? next : v) }
                    : { ...e, bullets: next, marks: marks(e.marks) },
              ),
            },
    ),
  };
}
