import { designOf, initial, type Resume } from "./model.ts";
const base = designOf(initial);
export const templates = [
  {
    id: "classic",
    name: "Classic ATS",
    description: "A centered header and simple section rules.",
    design: {
      ...base,
      mode: "ats" as const,
      font: "Arial",
      headerAlign: "center" as const,
    },
  },
  {
    id: "minimal",
    name: "Creative Minimal",
    description: "A left-aligned header with a soft violet accent.",
    design: {
      ...base,
      mode: "creative" as const,
      headerAlign: "left" as const,
      accent: "#5545ac",
    },
  },
  {
    id: "graduate",
    name: "Graduate Compact",
    description: "Tighter spacing for education, projects, and skills.",
    design: {
      ...base,
      mode: "ats" as const,
      font: "Arial",
      headerAlign: "left" as const,
      pageMargin: 14,
      density: "compact" as const,
      nameSize: 28,
      lineHeight: 1.35,
    },
  },
  {
    id: "studio",
    name: "Studio Blue",
    description: "A blue nameplate with generous section spacing.",
    design: {
      ...base,
      mode: "creative" as const,
      accent: "#245580",
      headerAlign: "left" as const,
      nameSize: 36,
      density: "relaxed" as const,
    },
  },
  {
    id: "editorial",
    name: "Editorial Green",
    description: "Serif typography with short green section rules.",
    design: {
      ...base,
      mode: "creative" as const,
      font: "Georgia",
      headerAlign: "right" as const,
      accent: "#22634e",
      ruleColor: "#22634e",
      nameSize: 38,
      headingSize: 16,
    },
  },
];
export function withTemplate(r: Resume, id: string): Resume {
  const t = templates.find((t) => t.id === id);
  return t ? { ...r, ...t.design, template: t.id } : r;
}
