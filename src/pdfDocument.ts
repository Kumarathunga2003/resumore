import { headerPhotoSlot, photoTravel } from "./photo.ts";
import { runs, type Mark, type Block } from "./emphasis.ts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { designOf, visibleContacts, webAddress, type Resume } from "./model.ts";
function formatted(
  text: string,
  marks?: Mark[],
  block: Block = {},
  defaultList: Block["list"] = "plain",
  top = 5,
): Content {
  const list = block.list ?? defaultList;
  const format = {
    alignment: block.alignment,
    lineHeight:
      block.lineHeight === undefined ? undefined : block.lineHeight / 1.2,
    margin: [(block.indent ?? 0) * 12, top, 0, 0] as [
      number,
      number,
      number,
      number,
    ],
  };
  if (list === "plain") return { ...format, text: runs(text, marks) };
  const items = Array.from(text.matchAll(/[^\n]+/g))
    .filter((m) => m[0].trim())
    .map((m) => ({
      text: runs(text, marks, m.index!, m.index! + m[0].length),
    }));
  return list === "number"
    ? { ...format, ol: items }
    : { ...format, ul: items };
}
export function pdfDocument(
  r: Resume,
  title?: string,
  photoImage?: string,
): TDocumentDefinitions {
  const d = designOf(r),
    creative = d.mode === "creative",
    ink = creative ? d.textColor : "#20212a",
    accent = creative ? d.accent : ink;
  const inset = (d.pageMargin * 72) / 25.4,
    width = (d.paper === "Letter" ? 612 : 595.28) - inset * 2;
  const band = creative && r.template === "studio",
    editorial = creative && r.template === "editorial";
  const content: Content[] = [];
  const rule = (color: string, thickness: number, length = width): Content => ({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: length,
        y2: 0,
        lineWidth: thickness,
        lineColor: color,
      },
    ],
  });
  if (creative && !band && !editorial) content.push(rule(accent, 2.5));
  const slot = r.photo && headerPhotoSlot(r.photo, r.paper, r.pageMargin);
  const headerStart = content.length;
  if (r.photo && photoImage && slot === "center")
    content.push({
      image: photoImage,
      width: r.photo.size * 0.75,
      alignment: "center",
      margin: [0, 0, 0, 6],
    });
  content.push({
    text: (r.name.trim() || "Your name").toUpperCase(),
    bold: true,
    color: accent,
    fontSize: d.nameSize * 0.75,
    alignment: d.headerAlign,
    margin: [0, 6, 0, 4],
  });
  if (band) {
    const name = content.pop()!;
    content.push({
      layout: "noBorders",
      table: {
        widths: ["*"],
        body: [
          [
            {
              ...(name as object),
              color: "white",
              fillColor: accent,
              margin: [8, 8, 8, 8],
            },
          ],
        ],
      },
      margin: [0, 0, 0, 6],
    });
  }
  if (r.role)
    content.push({
      text: r.role,
      alignment: d.headerAlign,
      fontSize: 11.25,
      margin: [0, 0, 0, 6],
    });
  const contacts = visibleContacts(r).map(({ key, value }, i) => ({
    text: (i ? "    " : "") + value,
    link: ["website", "linkedin", "github", "portfolio"].includes(key)
      ? webAddress(value)
      : undefined,
  }));
  if (contacts.length)
    content.push({
      text: contacts,
      alignment: d.headerAlign,
      fontSize: 8,
      margin: [0, 0, 0, 6],
    });
  if (r.photo && photoImage && (slot === "left" || slot === "right")) {
    const identity = {
      width: "*" as const,
      stack: content.splice(headerStart),
    };
    const portrait = { width: r.photo.size * 0.75, image: photoImage };
    content.push({
      columns: slot === "right" ? [identity, portrait] : [portrait, identity],
      columnGap: 12,
    });
  }
  const section = (heading: string) => {
    content.push(
      {
        text: heading.toUpperCase(),
        headlineLevel: 1,
        bold: true,
        fontSize: d.headingSize * 0.75,
        color: accent,
        margin: [
          0,
          d.density === "compact" ? 8 : d.density === "relaxed" ? 20 : 14,
          0,
          3,
        ],
      },
      rule(
        creative ? d.ruleColor : "#a7afb5",
        editorial ? 1.5 : 0.6,
        editorial ? 42 : width,
      ),
    );
  };
  if (r.summary.trim()) {
    section("Professional Summary");
    content.push(formatted(r.summary, r.summaryMarks, r.summaryBlock));
  }
  for (const s of r.sections) {
    if (!s.enabled) continue;
    const entries = (s.entries ?? []).filter(
      (e) => e.values.some((v) => v.trim()) || e.bullets.trim(),
    );
    if (!s.content.trim() && !entries.length) continue;
    section(s.label || "Additional information");
    if (s.content.trim()) content.push(formatted(s.content, s.marks, s.block));
    for (const e of entries) {
      if (e.values[0])
        content.push({ text: e.values[0], bold: true, margin: [0, 5, 0, 1] });
      const detail = e.values
        .slice(1, s.id === "projects" ? 4 : undefined)
        .filter(Boolean)
        .join(", ");
      if (detail) content.push({ text: detail });
      if (s.id === "projects")
        for (const [i, url] of e.values.slice(4, 6).entries()) {
          if (url.trim())
            content.push({
              text: (i ? "Live demo: " : "Project: ") + url,
              link: webAddress(url),
            });
        }
      if (e.bullets.trim())
        content.push(formatted(e.bullets, e.marks, e.block, "bullet", 2));
    }
  }
  if (r.photo?.placement && photoImage && !slot) {
    const travel = photoTravel(r.photo, d.paper);
    content.unshift({
      image: photoImage,
      width: r.photo.size * 0.75,
      absolutePosition: {
        x: r.photo.placement.x * travel.x * 0.75,
        y: r.photo.placement.y * travel.y * 0.75,
      },
    });
  }
  return {
    info: { title: title?.trim() || r.name.trim() || "Resume" },
    pageSize: d.paper === "Letter" ? "LETTER" : "A4",
    pageMargins: inset,
    defaultStyle: {
      font: "Document",
      color: ink,
      fontSize: d.bodySize * 0.75,
      lineHeight: d.lineHeight / 1.2,
    },
    content,
    pageBreakBefore: (node, following) =>
      node.headlineLevel === 1 && !following.some((n) => n.text || n.ul),
  };
}
