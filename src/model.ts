import { validPhoto, type Photo } from "./photo.ts";
import { validBlock, type Block, validMarks, type Mark } from "./emphasis.ts";
export type Mode = "ats" | "creative";
export type Entry = {
  id: string;
  values: string[];
  bullets: string;
  marks?: Mark[];
  block?: Block;
};
export type Section = {
  id: string;
  label: string;
  content: string;
  marks?: Mark[];
  block?: Block;
  enabled: boolean;
  entries?: Entry[];
};
export const contactLabels = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  website: "Website",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
} as const;
export type ContactKey = keyof typeof contactLabels;
export const sizeControls = {
  pageMargin: {
    label: "Page margins",
    min: 10,
    max: 28,
    step: 1,
    initial: 18,
    unit: "mm",
  },
  headingSize: {
    label: "Section headings",
    min: 12,
    max: 21,
    step: 1,
    initial: 14,
    unit: "px",
  },
  bodySize: {
    label: "Body text",
    min: 11,
    max: 17,
    step: 0.5,
    initial: 11.5,
    unit: "px",
  },
  nameSize: {
    label: "Name size",
    min: 24,
    max: 44,
    step: 1,
    initial: 32,
    unit: "px",
  },
  lineHeight: {
    label: "Line spacing",
    min: 1.25,
    max: 2,
    step: 0.05,
    initial: 1.7,
    unit: "×",
  },
} as const;
export type Resume = {
  targetJob?: string;
  jobDescription?: string;
  photo?: Photo;
  template?: string;
  pageMargin?: number;
  headingSize?: number;
  textColor?: string;
  ruleColor?: string;
  headerAlign?: "left" | "center" | "right";
  linkedin?: string;
  github?: string;
  portfolio?: string;
  hiddenContacts?: ContactKey[];
  bodySize?: number;
  nameSize?: number;
  lineHeight?: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  summaryMarks?: Mark[];
  summaryBlock?: Block;
  mode: Mode;
  accent: string;
  font: string;
  paper?: "A4" | "Letter";
  density?: "normal" | "compact" | "relaxed";
  sections: Section[];
};

export const initial: Resume = {
  name: "Gaweesha Bhagyajith Kumarathunga",
  role: "Computer Science Undergraduate",
  email: "",
  phone: "",
  location: "Weerapokuna, Sri Lanka",
  website: "",
  summary:
    "I am committed to delivering exceptional service to an organization where I can showcase my skills, take on meaningful challenges, and grow both personally and professionally while contributing to the achievement of the organization’s goals.",
  mode: "ats",
  accent: "#5545ac",
  font: "Plus Jakarta Sans",
  sections: [
    {
      id: "education",
      label: "Education",
      enabled: true,
      content:
        "BSc (Honors) in Computer Science, second year\nNSBM Green University, Sri Lanka\n\nDiploma in English, one year\nSITC Campus\n\nGCE Advanced Level\nICT: C, Engineering Technology: S, Science for Technology: S\n\nGCE Ordinary Level",
    },
    {
      id: "skills",
      label: "Skills",
      enabled: true,
      content:
        "Documentation and problem solving\nMicrosoft 365: Excel, PowerPoint and Word\nProgramming: Python, Java and C++\nWeb development: HTML, CSS and JavaScript",
    },
    {
      id: "languages",
      label: "Languages",
      enabled: true,
      content: "Sinhala, English and Tamil (learning)",
    },
    { id: "projects", label: "Projects", enabled: true, content: "" },
  ],
};
export type Draft = {
  version: 1;
  id: string;
  title: string;
  updated: number;
  resume: Resume;
};
export function validResume(value: unknown): value is Resume {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  if (!validPhoto(r.photo)) return false;
  const strings = [
    "name",
    "role",
    "email",
    "phone",
    "location",
    "website",
    "summary",
    "font",
    "accent",
  ];
  if (
    !strings.every((key) => typeof r[key] === "string") ||
    !["ats", "creative"].includes(String(r.mode))
  )
    return false;
  if (!/^#[0-9a-f]{6}$/i.test(String(r.accent)) || !Array.isArray(r.sections))
    return false;
  if (r.paper !== undefined && r.paper !== "A4" && r.paper !== "Letter")
    return false;
  if (
    r.density !== undefined &&
    !["normal", "compact", "relaxed"].includes(String(r.density))
  )
    return false;
  for (const key of [
    "linkedin",
    "github",
    "portfolio",
    "targetJob",
    "jobDescription",
  ])
    if (r[key] !== undefined && typeof r[key] !== "string") return false;
  if (
    r.hiddenContacts !== undefined &&
    (!Array.isArray(r.hiddenContacts) ||
      !r.hiddenContacts.every(
        (k) => typeof k === "string" && Object.hasOwn(contactLabels, k),
      ))
  )
    return false;
  for (const [key, range] of Object.entries(sizeControls)) {
    const n = r[key];
    if (
      n !== undefined &&
      (typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < range.min ||
        n > range.max)
    )
      return false;
  }
  if (
    ["textColor", "ruleColor"].some(
      (k) =>
        r[k] !== undefined &&
        (typeof r[k] !== "string" || !/^#[a-f0-9]{6}$/i.test(r[k])),
    )
  )
    return false;
  if (
    r.headerAlign !== undefined &&
    !["left", "center", "right"].includes(String(r.headerAlign))
  )
    return false;
  if (
    !validBlock(r.summaryBlock) ||
    !validMarks(r.summaryMarks, (r.summary as string).length)
  )
    return false;
  const ids = new Set<string>();
  return r.sections.every((s) => {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id ||
      ids.has(s.id) ||
      typeof s.content !== "string" ||
      typeof s.label !== "string" ||
      typeof s.enabled !== "boolean"
    )
      return false;
    if (!validBlock(s.block) || !validMarks(s.marks, s.content.length))
      return false;
    if (s.entries !== undefined) {
      if (!Array.isArray(s.entries)) return false;
      const keys = new Set<string>();
      for (const entry of s.entries) {
        if (
          !entry ||
          typeof entry.id !== "string" ||
          keys.has(entry.id) ||
          !Array.isArray(entry.values) ||
          !entry.values.every((v: unknown) => typeof v === "string") ||
          typeof entry.bullets !== "string"
        )
          return false;
        if (
          !validBlock(entry.block) ||
          !validMarks(entry.marks, entry.bullets.length)
        )
          return false;
        keys.add(entry.id);
      }
    }
    ids.add(s.id);
    return true;
  });
}
export function draft(sample = false): Draft {
  const resume = structuredClone(initial);
  if (!sample) {
    resume.sections.splice(3, 0, {
      id: "experience",
      label: "Work Experience",
      enabled: true,
      content: "",
    });
    Object.assign(resume, {
      name: "",
      role: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
    });
    resume.sections.forEach((s) => {
      s.content = "";
    });
  }
  return {
    id: crypto.randomUUID(),
    version: 1,
    title: sample ? "Gaweesha’s CV" : "Untitled resume",
    updated: Date.now(),
    resume,
  };
}
export function cleanSample(r: Resume): Resume {
  if (r.name.trim().toLowerCase() !== initial.name.toLowerCase()) return r;
  const sections = r.sections.flatMap((s) => {
    if (
      s.id !== "experience" ||
      s.content.trim().toLowerCase() !==
        "one year of work experience in communication."
    )
      return [s];
    return s.entries?.length ? [{ ...s, content: "", marks: undefined }] : [];
  });
  return sections.every((s, i) => s === r.sections[i]) &&
    sections.length === r.sections.length
    ? r
    : { ...r, sections };
}
export function fromBackup(value: unknown): Draft {
  const file = value as Partial<Draft> | null;
  if (
    !file ||
    file.version !== 1 ||
    typeof file.title !== "string" ||
    !validResume(file.resume)
  )
    throw Error("Choose a valid Resumora version 1 JSON backup.");
  return {
    ...draft(),
    title: file.title.trim() || "Imported resume",
    resume: cleanSample(file.resume),
  };
}
export function backup(d: Draft) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = (d.title.replace(/[^\w -]/g, "").trim() || "resume") + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function visibleContacts(r: Resume) {
  return (Object.keys(contactLabels) as ContactKey[])
    .filter((key) => r[key]?.trim() && !r.hiddenContacts?.includes(key))
    .map((key) => ({ key, value: r[key]!.trim() }));
}
export function webAddress(value: string) {
  if (!value || /\s/.test(value)) return undefined;
  try {
    const explicit = /^[a-z][a-z0-9+.-]*:/i.test(value);
    const url = new URL(explicit ? value : "https://" + value);
    return ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function designOf(r: Resume) {
  return {
    template: r.template,
    mode: r.mode,
    font: r.font,
    pageMargin: r.pageMargin ?? 18,
    headingSize: r.headingSize ?? 14,
    textColor: r.textColor ?? "#262636",
    ruleColor: r.ruleColor ?? "#a7afb5",
    headerAlign: r.headerAlign ?? (r.mode === "ats" ? "center" : "left"),
    accent: r.accent,
    paper: r.paper ?? "A4",
    density: r.density ?? "normal",
    bodySize: r.bodySize ?? sizeControls.bodySize.initial,
    nameSize: r.nameSize ?? sizeControls.nameSize.initial,
    lineHeight: r.lineHeight ?? sizeControls.lineHeight.initial,
  };
}
