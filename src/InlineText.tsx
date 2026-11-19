import { useLayoutEffect, useRef, type ReactNode } from "react";
import { FormattedField } from "./FormattedField";
import type { Block, Mark } from "./emphasis";

export type InlineField = {
  id: string;
  label: string;
  value: string;
  marks?: Mark[];
  block?: Block;
  change: (value: string, marks: Mark[]) => void;
  setBlock?: (block: Block) => void;
  defaultList?: Block["list"];
};
export function InlineText({
  field,
  children,
  active,
  open,
}: {
  field: InlineField;
  children: ReactNode;
  active: string;
  open: (id: string) => void;
}) {
  const editing = active === field.id;
  const range = useRef<[number, number]>([0, 0]);
  const wrapper = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (!editing) return;
    const input = wrapper.current?.querySelector("textarea,input");
    if (
      input instanceof HTMLTextAreaElement ||
      input instanceof HTMLInputElement
    ) {
      input.focus({ preventScroll: true });
      input.setSelectionRange(...range.current);
    }
  }, [editing]);
  return (
    <span
      ref={wrapper}
      className="inline-field"
      onKeyDown={(e) => {
        if (editing && e.key === "Escape") {
          e.stopPropagation();
          open("");
        }
      }}
    >
      {editing ? (
        <>
          {field.setBlock ? (
            <FormattedField
              {...field}
              id={"canvas-" + field.id}
              setBlock={field.setBlock}
              rows={Math.min(
                14,
                Math.max(
                  2,
                  field.value.split("\n").length +
                    Math.ceil(field.value.length / 85),
                ),
              )}
            />
          ) : (
            <input
              aria-label={field.label}
              value={field.value}
              onChange={(e) => field.change(e.target.value, [])}
              onKeyDown={(e) => {
                if (e.key === "Enter") open("");
              }}
            />
          )}
          <button className="finish-inline" onClick={() => open("")}>
            Done editing
          </button>
        </>
      ) : (
        <span
          role="button"
          tabIndex={0}
          aria-label={"Edit " + field.label}
          className="inline-target"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              range.current = [0, 0];
              open(field.id);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            const sel = window.getSelection();
            const r = sel?.rangeCount ? sel.getRangeAt(0) : null;
            const offset = (node: Node, pos: number) =>
              Number(
                node.parentElement?.closest<HTMLElement>("[data-offset]")
                  ?.dataset.offset || 0,
              ) + pos;
            range.current =
              r && e.currentTarget.contains(r.commonAncestorContainer)
                ? [
                    offset(r.startContainer, r.startOffset),
                    offset(r.endContainer, r.endOffset),
                  ]
                : [0, 0];
            open(field.id);
          }}
        >
          {children || field.label}
        </span>
      )}
    </span>
  );
}
