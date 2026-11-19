import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
type Option = {
  value?: string | number;
  disabled?: boolean;
  children: ReactNode;
};
export function ToolbarMenu({
  name,
  value,
  choose,
  icon,
  children,
}: {
  name: string;
  value: string | number | undefined;
  choose: (v: string) => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const options = Children.toArray(children)
    .filter(
      (n): n is ReactElement<Option> =>
        isValidElement<Option>(n) && !n.props.disabled,
    )
    .map((n) => ({
      label: n.props.children,
      value: String(n.props.value ?? n.props.children),
    }));
  const current = options.find((o) => o.value === String(value)) ?? options[0];
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    id = useId();
  const [open, setOpen] = useState(false);
  function show() {
    const el = panel.current,
      anchor = trigger.current;
    if (!el || !anchor) return;
    if (el.matches(":popover-open")) {
      el.hidePopover();
      return;
    }
    const rect = anchor.getBoundingClientRect();
    el.showPopover();
    const width = el.offsetWidth,
      height = el.offsetHeight;
    el.style.left =
      Math.max(6, Math.min(rect.left, innerWidth - width - 6)) + "px";
    el.style.top =
      (rect.bottom + height + 8 <= innerHeight
        ? rect.bottom + 6
        : Math.max(6, rect.top - height - 6)) + "px";
    el
      .querySelector<HTMLButtonElement>('[aria-selected="true"]')
      ?.focus({ preventScroll: true });
  }
  return (
    <>
      <button
        type="button"
        ref={trigger}
        className={"tool-choice" + (icon ? " icon-only" : "")}
        aria-label={name}
        title={name + ": " + current.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onMouseDown={(e) => e.preventDefault()}
        onClick={show}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            show();
          }
        }}
      >
        {icon || current.label}
      </button>
      <div
        id={id}
        ref={panel}
        popover="auto"
        role="listbox"
        aria-label={name}
        className="tool-options"
        onToggle={(e) => setOpen(e.currentTarget.matches(":popover-open"))}
        onKeyDown={(e) => {
          const buttons = Array.from(
            e.currentTarget.querySelectorAll("button"),
          );
          const i = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (step || e.key === "Home" || e.key === "End") {
            e.preventDefault();
            buttons[
              step
                ? (i + step + buttons.length) % buttons.length
                : e.key === "Home"
                  ? 0
                  : buttons.length - 1
            ].focus();
          }
          if (e.key === "Escape") {
            panel.current?.hidePopover();
            trigger.current?.focus();
          }
        }}
      >
        {options.map((o) => (
          <button
            type="button"
            role="option"
            aria-selected={o.value === current.value}
            key={o.value}
            tabIndex={o.value === current.value ? 0 : -1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              panel.current?.hidePopover();
              trigger.current?.focus({ preventScroll: true });
              choose(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}
