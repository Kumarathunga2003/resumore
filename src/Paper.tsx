import { useState, type ReactNode } from "react";
import { InlineText, type InlineField } from "./InlineText";
import { headerPhotoSlot } from "./photo";
import { CanvasPhoto } from "./CanvasPhoto";
import { runs, type Mark, type Block } from "./emphasis";
function StyledText({
  text,
  marks,
  block = {},
  defaultList = "plain",
  interactive = false,
}: {
  text: string;
  marks?: Mark[];
  block?: Block;
  defaultList?: Block["list"];
  interactive?: boolean;
}) {
  const list = block.list ?? defaultList;
  function inline(start: number, end: number) {
    let cursor = start;
    return runs(text, marks, start, end).map((r, i) => {
      const offset = cursor;
      cursor += r.text.length;
      const css: React.CSSProperties = {
        fontWeight: r.bold ? 700 : undefined,
        fontStyle: r.italics ? "italic" : undefined,
        fontFamily: r.italics
          ? r.font === "LiberationSerif"
            ? '"Resume Serif Italic"'
            : r.font
              ? '"Resume Sans Italic"'
              : "var(--italic-face)"
          : r.font === "Jakarta"
            ? "Plus Jakarta Sans"
            : r.font === "LiberationSans"
              ? "Arial,sans-serif"
              : r.font === "LiberationSerif"
                ? "Georgia,serif"
                : undefined,
        fontSize: r.fontSize ? r.fontSize + "pt" : undefined,
        letterSpacing:
          r.characterSpacing !== undefined
            ? r.characterSpacing + "pt"
            : undefined,
        color: r.color,
        backgroundColor: r.background,
        textDecoration: [r.decoration]
          .flat()
          .filter(Boolean)
          .map((d) => (d === "lineThrough" ? "line-through" : d))
          .join(" "),
      };
      return r.link && interactive ? (
        <a
          key={i}
          data-offset={interactive ? offset : undefined}
          style={css}
          href={r.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {r.text}
        </a>
      ) : (
        <span
          key={i}
          data-offset={interactive ? offset : undefined}
          style={css}
        >
          {r.text}
        </span>
      );
    });
  }
  const List = list === "number" ? "ol" : "ul";
  return (
    <div
      className="paper-lines"
      style={{
        textAlign: block.alignment,
        lineHeight: block.lineHeight,
        marginInlineStart: (block.indent ?? 0) * 12 + "pt",
      }}
    >
      {list === "plain" ? (
        inline(0, text.length)
      ) : (
        <List>
          {Array.from(text.matchAll(/[^\n]+/g))
            .filter((m) => m[0].trim())
            .map((m) => (
              <li key={m.index}>{inline(m.index!, m.index! + m[0].length)}</li>
            ))}
        </List>
      )}
    </div>
  );
}
import { visibleContacts, webAddress, type Resume } from "./model";
export function Paper({
  resume: r,
  interactive = false,
  onTextSelect,
  update,
}: {
  update?: (r: Resume) => void;
  onTextSelect?: (
    section: string,
    id: string,
    start: number,
    end: number,
  ) => void;
  resume: Resume;
  interactive?: boolean;
}) {
  const slot = r.photo && headerPhotoSlot(r.photo, r.paper, r.pageMargin);
  const [active, open] = useState("");
  const field = (data: InlineField, display: ReactNode) =>
    update ? (
      <InlineText key={data.id} field={data} active={active} open={open}>
        {display}
      </InlineText>
    ) : (
      display
    );
  const basic = (
    key: "name" | "role" | keyof typeof import("./model").contactLabels,
    label: string,
    display: ReactNode,
  ) =>
    field(
      {
        id: key,
        label,
        value: r[key] || "",
        change: (v) => update?.({ ...r, [key]: v }),
      },
      display,
    );
  function sectionChange(
    id: string,
    patch: Partial<Resume["sections"][number]>,
  ) {
    update?.({
      ...r,
      sections: r.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }
  return (
    <article
      onPointerUp={
        onTextSelect
          ? () => {
              const selection = window.getSelection();
              if (!selection || selection.isCollapsed || !selection.rangeCount)
                return;
              const range = selection.getRangeAt(0);
              function point(node: Node, offset: number) {
                if (node.nodeType !== Node.TEXT_NODE) return;
                const run =
                  node.parentElement?.closest<HTMLElement>("[data-offset]");
                const field = run?.closest<HTMLElement>("[data-edit-field]");
                if (run && field)
                  return { field, index: Number(run.dataset.offset) + offset };
              }
              const a = point(range.startContainer, range.startOffset),
                b = point(range.endContainer, range.endOffset);
              if (a && b && a.field === b.field)
                onTextSelect(
                  a.field.dataset.editSection!,
                  a.field.dataset.editField!,
                  a.index,
                  b.index,
                );
            }
          : undefined
      }
      data-template={r.mode === "creative" ? r.template : undefined}
      data-serif={r.font === "Georgia"}
      data-paper={r.paper || "A4"}
      data-density={r.density || "normal"}
      className={"resume-paper " + r.mode}
      style={
        {
          fontFamily:
            r.font === "Plus Jakarta Sans"
              ? '"Plus Jakarta Sans",Arial,sans-serif'
              : r.font === "Georgia"
                ? "Georgia,serif"
                : r.font === "Arial"
                  ? "Arial,sans-serif"
                  : "system-ui,sans-serif",
          "--accent": r.accent,
          "--page-inset": (r.pageMargin ?? 18) + "mm",
          "--heading-size": (r.headingSize ?? 14) + "px",
          "--ink": r.mode === "ats" ? "#20212a" : (r.textColor ?? "#262636"),
          "--rule": r.mode === "ats" ? "#a7afb5" : (r.ruleColor ?? "#a7afb5"),
          "--head-align":
            r.headerAlign ?? (r.mode === "ats" ? "center" : "left"),
          "--contacts-align": {
            left: "flex-start",
            center: "center",
            right: "flex-end",
          }[r.headerAlign ?? (r.mode === "ats" ? "center" : "left")],
          "--body-size":
            r.bodySize === undefined ? undefined : r.bodySize + "px",
          "--name-size":
            r.nameSize === undefined ? undefined : r.nameSize + "px",
          "--line-height": r.lineHeight,
        } as React.CSSProperties
      }
    >
      <header
        className="resume-heading"
        data-photo-side={slot === "center" ? undefined : slot}
      >
        {r.photo && (
          <CanvasPhoto
            photo={r.photo}
            paper={r.paper}
            slot={slot}
            move={
              update
                ? (placement) =>
                    update({ ...r, photo: { ...r.photo!, placement } })
                : undefined
            }
          />
        )}
        <h1>{basic("name", "Full name", r.name || "Your name")}</h1>
        {(r.role || update) && (
          <p>{basic("role", "Professional headline", r.role)}</p>
        )}
        <div className="contact-line">
          {visibleContacts(r).map(({ key, value }) => {
            const href =
              interactive &&
              ["website", "linkedin", "github", "portfolio"].includes(key)
                ? webAddress(value)
                : undefined;
            return (
              <span key={key}>
                {basic(
                  key,
                  key,
                  href && !update ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      {value}
                    </a>
                  ) : (
                    value
                  ),
                )}
              </span>
            );
          })}
        </div>
      </header>
      {(r.summary.trim() || update) && (
        <section className="resume-block">
          <h2>Professional Summary</h2>
          <div
            className="resume-content"
            data-edit-section="profile"
            data-edit-field="summary"
          >
            {field(
              {
                id: "summary",
                label: "Professional summary",
                value: r.summary,
                marks: r.summaryMarks,
                block: r.summaryBlock,
                change: (summary, summaryMarks) =>
                  update?.({ ...r, summary, summaryMarks }),
                setBlock: (summaryBlock) => update?.({ ...r, summaryBlock }),
              },
              r.summary && (
                <StyledText
                  interactive={interactive}
                  text={r.summary}
                  marks={r.summaryMarks}
                  block={r.summaryBlock}
                />
              ),
            )}
          </div>
        </section>
      )}
      {r.sections
        .filter(
          (s) =>
            s.enabled &&
            (update ||
              s.content.trim() ||
              s.entries?.some(
                (e) => e.values.some((v) => v.trim()) || e.bullets.trim(),
              )),
        )
        .map((s) => (
          <section key={s.id} className="resume-block">
            <h2>
              {field(
                {
                  id: s.id + "-label",
                  label: "Section heading",
                  value: s.label,
                  change: (label) => sectionChange(s.id, { label }),
                },
                s.label || "Additional information",
              )}
            </h2>
            {(s.content || update) && (
              <div
                className="resume-content"
                data-edit-section={s.id}
                data-edit-field="section-content"
              >
                {field(
                  {
                    id: s.id + "-content",
                    label: s.label + " content",
                    value: s.content,
                    marks: s.marks,
                    block: s.block,
                    change: (content, marks) =>
                      sectionChange(s.id, { content, marks }),
                    setBlock: (block) => sectionChange(s.id, { block }),
                  },
                  s.content && (
                    <StyledText
                      interactive={interactive}
                      block={s.block}
                      text={s.content}
                      marks={s.marks}
                    />
                  ),
                )}
              </div>
            )}
            {s.entries?.map((e) => {
              const changeEntry = (patch: Partial<typeof e>) =>
                sectionChange(s.id, {
                  entries: s.entries?.map((item) =>
                    item.id === e.id ? { ...item, ...patch } : item,
                  ),
                });
              const entryValue = (v: string, i: number, display: ReactNode) =>
                field(
                  {
                    id: e.id + "-" + i,
                    label: i === 0 ? "Entry title" : "Entry detail",
                    value: v,
                    change: (text) => {
                      const values = [...e.values];
                      values[i] = text;
                      changeEntry({ values });
                    },
                  },
                  display,
                );
              return (
                <div
                  className="paper-entry"
                  key={e.id}
                  data-edit-section={s.id}
                  data-edit-field={"entry-bullets-" + e.id}
                >
                  {(e.values[0] || update) && (
                    <strong>
                      {entryValue(e.values[0] || "", 0, e.values[0])}
                    </strong>
                  )}
                  <div>
                    {e.values.slice(1).map((v, index) => {
                      if (!v) return null;
                      const link =
                        s.id === "projects" && index >= 3
                          ? webAddress(v)
                          : undefined;
                      return (
                        <span key={index}>
                          {e.values.slice(1, index + 1).some(Boolean)
                            ? ", "
                            : ""}
                          {entryValue(
                            v,
                            index + 1,
                            link && interactive && !update ? (
                              <a href={link} target="_blank" rel="noreferrer">
                                {v}
                              </a>
                            ) : (
                              v
                            ),
                          )}
                        </span>
                      );
                    })}
                  </div>
                  {(e.bullets.trim() || update) &&
                    field(
                      {
                        id: e.id + "-bullets",
                        label: "Entry details",
                        value: e.bullets,
                        marks: e.marks,
                        block: e.block,
                        defaultList: "bullet",
                        change: (bullets, marks) =>
                          changeEntry({ bullets, marks }),
                        setBlock: (block) => changeEntry({ block }),
                      },
                      e.bullets && (
                        <StyledText
                          interactive={interactive}
                          text={e.bullets}
                          marks={e.marks}
                          block={e.block}
                          defaultList="bullet"
                        />
                      ),
                    )}
                </div>
              );
            })}
          </section>
        ))}
    </article>
  );
}
