// Offsets use UTF-16 units, matching textarea.selectionStart and selectionEnd.
export type Face = "Jakarta" | "LiberationSans" | "LiberationSerif";
export type Paint = {
  font?: Face;
  fontSize?: number;
  color?: string;
  background?: string;
  characterSpacing?: number;
  link?: string;
};
export type Block = {
  alignment?: "left" | "center" | "right" | "justify";
  list?: "plain" | "bullet" | "number";
  indent?: number;
  lineHeight?: number;
};
export type Mark = Paint & { start: number; end: number; style: number };
export const italic = 4,
  strike = 8;
export function validBlock(x: unknown) {
  if (x === undefined) return true;
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  return Object.entries(x).every(([k, v]) =>
    k === "alignment"
      ? ["left", "center", "right", "justify"].includes(v)
      : k === "list"
        ? ["plain", "bullet", "number"].includes(v)
        : k === "indent"
          ? Number.isInteger(v) && v >= 0 && v <= 4
          : k === "lineHeight" && [1, 1.25, 1.5, 1.75, 2].includes(v),
  );
}
export function safeLink(value: string) {
  if (!value || /\s/.test(value)) return undefined;
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) &&
      u.hostname &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
function validPaint(m: Mark) {
  return (
    (m.font === undefined ||
      ["Jakarta", "LiberationSans", "LiberationSerif"].includes(m.font)) &&
    (m.fontSize === undefined ||
      (Number.isInteger(m.fontSize) && m.fontSize >= 6 && m.fontSize <= 72)) &&
    [m.color, m.background].every(
      (v) =>
        v === undefined || (typeof v === "string" && /^#[a-f0-9]{6}$/i.test(v)),
    ) &&
    (m.characterSpacing === undefined ||
      [0, 0.5, 1, 2, 3].includes(m.characterSpacing)) &&
    (m.link === undefined || (typeof m.link === "string" && !!safeLink(m.link)))
  );
}
export function paintOf(m?: Mark): Paint {
  if (!m) return {};
  const { font, fontSize, color, background, characterSpacing, link } = m;
  return Object.fromEntries(
    Object.entries({
      font,
      fontSize,
      color,
      background,
      characterSpacing,
      link,
    }).filter(([, v]) => v !== undefined),
  );
}
export const bold = 1,
  underline = 2;
export function validMarks(value: unknown, length: number) {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  let end = 0;
  return value.every((m) => {
    if (
      !m ||
      !Number.isInteger(m.start) ||
      !Number.isInteger(m.end) ||
      m.start < end ||
      m.end <= m.start ||
      m.end > length ||
      !Number.isInteger(m.style) ||
      m.style < 0 ||
      m.style > 15 ||
      !validPaint(m)
    )
      return false;
    end = m.end;
    return true;
  });
}
function merge(marks: Mark[]) {
  const result: Mark[] = [];
  for (const mark of marks) {
    if (
      mark.end <= mark.start ||
      (!mark.style && !Object.keys(paintOf(mark)).length)
    )
      continue;
    const last = result.at(-1);
    if (
      last?.end === mark.start &&
      last.style === mark.style &&
      JSON.stringify(paintOf(last)) === JSON.stringify(paintOf(mark))
    )
      last.end = mark.end;
    else result.push({ ...mark });
  }
  return result;
}
export function runs(
  text: string,
  marks: Mark[] = [],
  start = 0,
  end = text.length,
) {
  const result: (Paint & {
    text: string;
    bold: boolean;
    italics: boolean;
    decoration?: "underline" | "lineThrough" | ("underline" | "lineThrough")[];
  })[] = [];
  let cursor = start;
  function add(from: number, to: number, style: number, m?: Mark) {
    if (to <= from) return;
    const lines: ("underline" | "lineThrough")[] = [];
    if (style & underline || m?.link) lines.push("underline");
    if (style & strike) lines.push("lineThrough");
    result.push({
      ...paintOf(m),
      text: text.slice(from, to),
      bold: !!(style & bold),
      italics: !!(style & italic),
      decoration: lines.length > 1 ? lines : lines[0],
    });
  }
  for (const m of marks) {
    if (m.end <= start) continue;
    if (m.start >= end) break;
    add(cursor, Math.min(m.start, end), 0);
    add(Math.max(start, m.start), Math.min(end, m.end), m.style, m);
    cursor = Math.min(m.end, end);
  }
  add(cursor, end, 0);
  return result;
}
export function markSelection(
  text: string,
  marks: Mark[],
  start: number,
  end: number,
  style: number,
) {
  if (start === end) return marks;
  const covered = marks.filter((m) => m.start < end && m.end > start);
  const remove =
    covered
      .filter((m) => m.style & style)
      .reduce(
        (n, m) => n + Math.min(end, m.end) - Math.max(start, m.start),
        0,
      ) ===
    end - start;
  return rangeEdit(text, marks, start, end, (m) =>
    style === 0
      ? { style: 0 }
      : { ...m, style: remove ? m.style & ~style : m.style | style },
  );
}
export function rangeEdit(
  text: string,
  marks: Mark[],
  start: number,
  end: number,
  change: (m: Pick<Mark, "style"> & Paint) => Pick<Mark, "style"> & Paint,
) {
  const points = [
    ...new Set([
      0,
      text.length,
      start,
      end,
      ...marks.flatMap((m) => [m.start, m.end]),
    ]),
  ].sort((a, b) => a - b);
  let i = 0;
  return merge(
    points.slice(1).map((to, j) => {
      const from = points[j];
      while (i < marks.length && marks[i].end <= from) i++;
      const m = marks[i]?.start <= from ? marks[i] : undefined;
      const base = { ...paintOf(m), style: m?.style ?? 0 };
      return {
        ...(from >= start && to <= end ? change(base) : base),
        start: from,
        end: to,
      };
    }),
  );
}
export function editMarks(
  old: string,
  next: string,
  marks: Mark[],
  caret?: number,
) {
  if (!marks.length || old === next) return marks;
  let a = 0,
    b = old.length,
    c = next.length;
  const suffixLimit = caret ?? next.length;
  while (c > suffixLimit && b > 0 && old[b - 1] === next[c - 1]) {
    b--;
    c--;
  }
  while (a < b && a < c && old[a] === next[a]) a++;
  while (b > a && c > a && old[b - 1] === next[c - 1]) {
    b--;
    c--;
  }
  const delta = next.length - old.length;
  const inherited = marks.find(
    (m) => m.start <= a && m.end >= b && (a !== b || m.start < a),
  );
  return merge([
    ...marks.map((m) => ({ ...m, end: Math.min(m.end, a) })),
    { ...paintOf(inherited), start: a, end: c, style: inherited?.style ?? 0 },
    ...marks.map((m) => ({
      ...m,
      start: Math.max(m.start, b) + delta,
      end: m.end + delta,
    })),
  ]);
}
