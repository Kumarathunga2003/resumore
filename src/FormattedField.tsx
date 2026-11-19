import { ToolbarMenu } from "./ToolbarMenu";
import { createPortal } from "react-dom";
import { FormattingDock } from "./FormattingDock";
import { DockIcon } from "./Icons";
import { useContext, useEffect, type ReactNode, useRef, useState } from "react";
import {
  bold,
  underline,
  italic,
  strike,
  editMarks,
  markSelection,
  rangeEdit,
  paintOf,
  safeLink,
  type Paint,
  type Mark,
  type Block,
  type Face,
} from "./emphasis";
let copied: (Paint & { style: number }) | undefined;
export function FormattedField({
  id,
  passageId = id,
  label,
  value,
  marks = [],
  change,
  block = {},
  setBlock,
  defaultList = "plain",
  rows = 5,
}: {
  id: string;
  passageId?: string;
  label: string;
  value: string;
  marks?: Mark[];
  block?: Block;
  setBlock: (b: Block) => void;
  defaultList?: Block["list"];
  change: (value: string, marks: Mark[]) => void;
  rows?: number;
}) {
  const [url, setUrl] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const dock = useContext(FormattingDock)!;
  const mirror = useRef<HTMLDivElement>(null);
  const issues = dock.suggestions.filter(s => s.p.id === passageId);
  const underlines: ReactNode[] = [];
  let cursor = 0;
  for (const { i, key } of issues) {
    underlines.push(value.slice(cursor, i.start), <span key={key}>{i.before}</span>);
    cursor = i.start + i.before.length;
  }
  underlines.push(value.slice(cursor), "\u200b");
  const primary = id === "summary" || id === "section-content";
  const visible = dock.active === id || (!dock.active && primary);
  const activate = dock.activate;
  useEffect(
    () => () => activate((current) => (current === id ? "" : current)),
    [id, activate],
  );
  const [moreTools, setMoreTools] = useState(false);
  const [menu, setMenu] = useState<"spacing" | "style" | null>(null);
  useEffect(() => {
    if (!visible) {
      setMenu(null);
      setUrl(null);
    }
  }, [visible]);
  useEffect(() => {
    if (!menu && url === null) return;
    function close(e: PointerEvent) {
      if (!dock.host?.contains(e.target as Node)) {
        setMenu(null);
        setUrl(null);
      }
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null);
        setUrl(null);
        ref.current?.focus();
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menu, url, dock.host]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [[start, end], select] = useState<[number, number]>([0, 0]);
  const empty = end <= start;
  const [typing, setTyping] = useState<
    (Paint & { style: number; at: number }) | null
  >(null);
  const caretStyle = empty && typing?.at === start ? typing : null;
  const offset = empty ? Math.max(0, start - 1) : start;
  const first = marks.find((m) => m.start <= offset && m.end > offset);
  const active = caretStyle
    ? { ...paintOf({ ...caretStyle, start, end }), style: caretStyle.style }
    : { ...paintOf(first), style: first?.style ?? 0 };
  function commit(next: Mark[]) {
    change(value, next);
    ref.current?.focus();
    ref.current?.setSelectionRange(start, end);
  }
  function apply(
    transform: (m: Paint & { style: number }) => Paint & { style: number },
  ) {
    if (!empty) {
      commit(rangeEdit(value, marks, start, end, transform));
      return;
    }
    setTyping({ ...transform(active), at: start });
    ref.current?.focus();
    ref.current?.setSelectionRange(start, start);
  }
  function paint(props: Paint) {
    apply((m) => ({ ...m, ...props }));
  }
  function toggle(bit: number) {
    if (empty)
      apply((m) => (bit ? { ...m, style: m.style ^ bit } : { style: 0 }));
    else commit(markSelection(value, marks, start, end, bit));
  }
  function linkEditor() {
    setUrl(active.link ?? "");
    setMessage("");
  }
  function button(
    name: string,
    caption: ReactNode,
    action: () => void,
    disabled = false,
    pressed?: boolean,
  ) {
    return (
      <button
        type="button"
        key={name}
        aria-label={name}
        title={name}
        disabled={disabled}
        aria-pressed={pressed}
        onMouseDown={(e) => e.preventDefault()}
        onClick={action}
      >
        {caption}
      </button>
    );
  }
  useEffect(() => {
    const input = ref.current, layer = mirror.current;
    if (!input || !layer) return;
    function sync() {
      if (!input || !layer) return;
      const style = getComputedStyle(input);
      for (const prop of ["font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","padding","tab-size","word-spacing"])
        layer.style.setProperty(prop, style.getPropertyValue(prop));
      layer.style.left = input.offsetLeft + input.clientLeft + "px";
      layer.style.top = input.offsetTop + input.clientTop + "px";
      layer.style.width = input.clientWidth + "px";
      layer.style.height = input.clientHeight + "px";
      layer.scrollTop = input.scrollTop;
    }
    const observer = new ResizeObserver(sync);
    observer.observe(input);
    sync();
    return () => observer.disconnect();
  }, [id]);
  const size = active.fontSize ?? dock.size;
  return (
    <div className="field formatted-field">
      <label htmlFor={id}>{label}</label>
      {visible &&
        dock.host &&
        createPortal(
          <div className="ribbon-wrap">
            <div
              className="type-ribbon"
              data-expanded={moreTools}
              role="toolbar"
              aria-label={label + " formatting"}
            >
              {button("Undo", <DockIcon.Undo />, dock.undo, !dock.canUndo)}
              {button("Redo", <DockIcon.Redo />, dock.redo, !dock.canRedo)}
              <span className="toolbar-divider" aria-hidden="true" />
              <ToolbarMenu
                name="Text style"
                value={
                  active.style & bold &&
                  [13, 16, 22].includes(active.fontSize ?? 0)
                    ? active.fontSize
                    : "0"
                }
                choose={(value) => {
                  const n = Number(value);
                  apply((m) => ({
                    ...m,
                    style: n ? m.style | bold : m.style & ~bold,
                    fontSize: n || undefined,
                  }));
                }}
              >
                <option value="" disabled>
                  Style
                </option>
                <option value="0">Aa</option>
                <option value="22">H1</option>
                <option value="16">H2</option>
                <option value="13">H3</option>
              </ToolbarMenu>
              <ToolbarMenu
                name="Text font"
                value={active.font ?? ""}
                choose={(value) =>
                  paint({
                    font: (value || undefined) as Face | undefined,
                  })
                }
              >
                <option value="">{dock.font}</option>
                <option value="Jakarta">Jakarta Sans</option>
                <option value="LiberationSans">Liberation Sans</option>
                <option value="LiberationSerif">Liberation Serif</option>
              </ToolbarMenu>
              <div className="size-stepper">
                {button(
                  "Decrease font size",
                  "−",
                  () => paint({ fontSize: size - 1 }),
                  size <= 6,
                )}
                <ToolbarMenu
                  name="Font size in points"
                  value={active.fontSize ?? ""}
                  choose={(value) =>
                    paint({ fontSize: Number(value) || undefined })
                  }
                >
                  <option value="">{size}</option>
                  {Array.from({ length: 67 }, (_, i) => i + 6).map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </ToolbarMenu>
                {button(
                  "Increase font size",
                  "+",
                  () => paint({ fontSize: size + 1 }),
                  size >= 72,
                )}
              </div>
              {(["color", "background"] as const).map((key, i) => (
                <label
                  className="ink-tool"
                  title={i ? "Highlight" : "Text color"}
                  key={key}
                  style={{ "--swatch": active[key] } as React.CSSProperties}
                >
                  {i ? <DockIcon.Marker /> : "A"}
                  <input
                    type="color"
                    aria-label={i ? "Highlight color" : "Text color"}
                    value={active[key] ?? (i ? "#fff0a6" : "#222222")}
                    onChange={(e) => paint({ [key]: e.target.value })}
                  />
                </label>
              ))}
              {(
                [
                  [bold, "Bold", "B"],
                  [italic, "Italic", "I"],
                  [underline, "Underline", "U"],
                  [strike, "Strikethrough", "S"],
                ] as const
              ).map(([bit, name, symbol]) =>
                button(
                  name,
                  symbol,
                  () => toggle(bit),
                  false,
                  empty
                    ? !!(active.style & bit)
                    : marks
                        .filter((m) => m.style & bit)
                        .reduce(
                          (n, m) =>
                            n +
                            Math.max(
                              0,
                              Math.min(end, m.end) - Math.max(start, m.start),
                            ),
                          0,
                        ) ===
                        end - start,
                ),
              )}
              {button(
                "Insert or edit hyperlink",
                <DockIcon.Link />,
                () => {
                  setMenu(null);
                  linkEditor();
                },
                false,
              )}
              <ToolbarMenu
                icon={<DockIcon.Align />}
                name="Paragraph alignment"
                value={block.alignment ?? "left"}
                choose={(value) =>
                  setBlock({
                    ...block,
                    alignment: value as Block["alignment"],
                  })
                }
              >
                {["left", "center", "right", "justify"].map((s) => (
                  <option value={s} key={s}>
                    Align {s}
                  </option>
                ))}
              </ToolbarMenu>
              <ToolbarMenu
                icon={<DockIcon.List />}
                name="List style"
                value={block.list ?? defaultList}
                choose={(value) =>
                  setBlock({
                    ...block,
                    list: value as Block["list"],
                  })
                }
              >
                <option value="plain">Plain lines</option>
                <option value="bullet">Bullet list</option>
                <option value="number">Numbered list</option>
              </ToolbarMenu>
              {button(
                "Spacing",
                <DockIcon.Spacing />,
                () => {
                  setUrl(null);
                  setMenu(menu === "spacing" ? null : "spacing");
                },
                false,
                menu === "spacing",
              )}
              {button(
                "Decrease indent",
                <DockIcon.Outdent />,
                () => setBlock({ ...block, indent: (block.indent ?? 0) - 1 }),
                !block.indent,
              )}
              {button(
                "Increase indent",
                <DockIcon.Indent />,
                () => setBlock({ ...block, indent: (block.indent ?? 0) + 1 }),
                (block.indent ?? 0) >= 4,
              )}
              {button(
                "Format painter",
                <DockIcon.Roller />,
                () => {
                  setUrl(null);
                  setMenu(menu === "style" ? null : "style");
                },
                false,
                menu === "style",
              )}
              <button type="button" className="mobile-more" aria-expanded={moreTools}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setMoreTools(!moreTools); setMenu(null); setUrl(null); }}>
                {moreTools ? "Fewer tools" : "More tools"}
              </button>
            </div>
            {menu === "spacing" && (
              <div className="tool-pop" aria-label="Spacing settings">
                {" "}
                <label>
                  Letter spacing
                  <ToolbarMenu
                    name="Letter spacing"
                    value={active.characterSpacing ?? 0}
                    choose={(value) =>
                      paint({ characterSpacing: Number(value) })
                    }
                  >
                    {[0, 0.5, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        Tracking {n} pt
                      </option>
                    ))}
                  </ToolbarMenu>
                </label>
                <label>
                  Line spacing
                  <ToolbarMenu
                    name="Line spacing"
                    value={block.lineHeight ?? ""}
                    choose={(value) =>
                      setBlock({
                        ...block,
                        lineHeight: Number(value) || undefined,
                      })
                    }
                  >
                    <option value="">CV spacing</option>
                    {[1, 1.25, 1.5, 1.75, 2].map((n) => (
                      <option key={n} value={n}>
                        Spacing {n}
                      </option>
                    ))}
                  </ToolbarMenu>
                </label>
              </div>
            )}
            {menu === "style" && (
              <div className="tool-pop">
                {button(
                  "Copy formatting",
                  "Copy style",
                  () => {
                    const { link, ...style } = active;
                    copied = style;
                    setMessage(
                      "Style copied. Select other text and choose Apply style.",
                    );
                  },
                  false,
                )}
                {button(
                  "Apply copied formatting",
                  "Apply style",
                  () => {
                    if (copied)
                      apply((m) => ({
                        ...copied!,
                        link: m.link,
                      }));
                    else
                      setMessage("Choose Copy style on formatted text first.");
                  },
                  false,
                )}
                {button("Clear formatting", "Clear", () => toggle(0), false)}
              </div>
            )}
            {url !== null && (
              <div className="link-edit tool-pop">
                <label>
                  Link address
                  <input
                    autoFocus
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </label>
                {button("Save link", "Save link", () => {
                  const link = safeLink(url.trim());
                  if (!link) {
                    setMessage("Enter a complete https:// or http:// address.");
                    return;
                  }
                  if (empty) {
                    const next =
                      value.slice(0, start) + link + value.slice(end);
                    const after = start + link.length;
                    change(
                      next,
                      rangeEdit(
                        next,
                        editMarks(value, next, marks, after),
                        start,
                        after,
                        () => ({ ...active, link }),
                      ),
                    );
                    setTyping(null);
                    requestAnimationFrame(() => {
                      ref.current?.focus();
                      ref.current?.setSelectionRange(start, after);
                    });
                  } else paint({ link });
                  setUrl(null);
                  setMessage("");
                })}
                {button("Remove link", "Remove link", () => {
                  paint({ link: undefined });
                  setUrl(null);
                  setMessage("");
                })}
                {button("Cancel link edit", "Cancel", () => {
                  setUrl(null);
                  setMessage("");
                })}
              </div>
            )}
          </div>,
          dock.host,
        )}
      <div className="checked-input">
      <textarea
        spellCheck={false}
        onScroll={e => { if (mirror.current) mirror.current.scrollTop = e.currentTarget.scrollTop; }}
        aria-label={label}
        onFocus={() => activate(id)}
        ref={ref}
        id={id}
        value={value}
        rows={rows}
        onSelect={(e) => {
          const a = e.currentTarget.selectionStart,
            b = e.currentTarget.selectionEnd;
          setTyping((t) => (t?.at === a && a === b ? t : null));
          select([a, b]);
        }}
        onChange={(e) => {
          setUrl(null);
          const next = e.target.value,
            caret = e.target.selectionStart;
          let updated = editMarks(value, next, marks, caret);
          if (
            caretStyle &&
            next.length > value.length &&
            caret === start + next.length - value.length
          ) {
            updated = rangeEdit(next, updated, start, caret, () => active);
            setTyping({ ...active, at: caret });
          } else setTyping(null);
          select([caret, e.target.selectionEnd]);
          change(next, updated);
        }}
        onKeyDown={(e) => {
          if (!(e.ctrlKey || e.metaKey)) return;
          const key = e.key.toLowerCase();
          if (["b", "i", "u", "k"].includes(key)) {
            e.preventDefault();
            if (key === "k") linkEditor();
            else toggle(key === "b" ? bold : key === "i" ? italic : underline);
          }
        }}
      />
      <div ref={mirror} className="writing-underlines" aria-hidden="true">{underlines}</div>
      </div>
      <small>
        Select words to format them, or choose a style and start typing. See
        your changes in the live preview.
      </small>
      {message && <small role="status">{message}</small>}
    </div>
  );
}
