const paths = {
  Undo: "M9 4 3 10l6 6M4 10h10a6 6 0 0 1 6 6v3",
  Redo: "m15 4 6 6-6 6m5-6H10a6 6 0 0 0-6 6v3",
  Align: "M3 5h18M3 10h12M3 15h18M3 20h12",
  List: "M8 6h13M8 12h13M8 18h13M3 6h.5M3 12h.5M3 18h.5",
  Spacing: "M6 3h12M12 3v11M3 19h18M6 16l-3 3 3 3m12-6 3 3-3 3",
  Indent: "M3 4h18M12 9h9M12 15h9M3 20h18M3 9l4 3-4 3",
  Outdent: "M3 4h18M12 9h9M12 15h9M3 20h18M7 9l-4 3 4 3",
  Roller: "M3 3h13v6H3z M16 6h3q2 0 2 2v3q0 2-2 2l-7 1v3M10 17h4v5h-4z",
  Marker: "m5 14 8-10 5 4-8 10-5-4z M5 14l-2 6 7-2",
  Link: "m9 15 6-6M7 13l-2 2a3.5 3.5 0 0 0 5 5l4-4a3.5 3.5 0 0 0 0-5m3 0 2-2a3.5 3.5 0 0 0-5-5l-4 4a3.5 3.5 0 0 0 0 5",

  ArrowDown: "M12 4v16m-6-6 6 6 6-6",
  ArrowUp: "M12 20V4m-6 6 6-6 6 6",
  BriefcaseBusiness: "M3 8h18v12H3z M8 8V5h8v3 M3 12q9 5 18 0",
  Check: "m4 12 5 5L20 6",
  ChevronDown: "m6 9 6 6 6-6",
  CircleHelp:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 9q1-5 6-2 3 3-2 6v1m0 3h.1",
  Download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  FileCheck2: "M4 2h11l4 5v15H4z M7 13l3 3 6-6",
  FileText: "M5 2h10l4 4v16H5z M8 10h8m-8 4h8m-8 4h5",
  GraduationCap: "m1 9 11-6 11 6-11 6z M5 12v5l7 4 7-4v-5",
  Layers3: "m3 8 9-5 9 5-9 5z M3 12l9 5 9-5m-18 4 9 5 9-5",
  LayoutTemplate: "M3 3h18v18H3z M3 9h18m-12 0v12",
  Menu: "M3 6h18M3 12h18M3 18h18",
  Palette: "M12 2C0 2 0 21 12 21q4 0 2-4t4-3c7 0 3-12-6-12z M7 9h1m3-3h1m4 3h1",
  Plus: "M12 4v16M4 12h16",
  RotateCcw: "M4 11a8 8 0 1 1 1 6M4 4v7h7",
  ShieldCheck: "m12 2 8 3v7q0 6-8 10-8-4-8-10V5z M8 11l3 3 5-6",
  Sparkles: "m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3z",
  Trash2: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15",
  Arrow: "M3 12h16m-6-6 6 6-6 6",
  Lock: "M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3",
};
function icon(name: keyof typeof paths) {
  return function Icon({ size = 18 }: { size?: number }) {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[name]} />
      </svg>
    );
  };
}
export const ArrowDown = icon("ArrowDown");
export const ArrowUp = icon("ArrowUp");
export const BriefcaseBusiness = icon("BriefcaseBusiness");
export const Check = icon("Check");
export const ChevronDown = icon("ChevronDown");
export const CircleHelp = icon("CircleHelp");
export const Download = icon("Download");
export const FileCheck2 = icon("FileCheck2");
export const FileText = icon("FileText");
export const GraduationCap = icon("GraduationCap");
export const Layers3 = icon("Layers3");
export const LayoutTemplate = icon("LayoutTemplate");
export const Menu = icon("Menu");
export const Palette = icon("Palette");
export const Plus = icon("Plus");
export const RotateCcw = icon("RotateCcw");
export const ShieldCheck = icon("ShieldCheck");
export const Sparkles = icon("Sparkles");
export const Trash2 = icon("Trash2");
export const Arrow = icon("Arrow");
export const Lock = icon("Lock");

export const DockIcon = {
  Undo: icon("Undo"),
  Redo: icon("Redo"),
  Align: icon("Align"),
  List: icon("List"),
  Spacing: icon("Spacing"),
  Indent: icon("Indent"),
  Outdent: icon("Outdent"),
  Roller: icon("Roller"),
  Marker: icon("Marker"),
  Link: icon("Link"),
};
