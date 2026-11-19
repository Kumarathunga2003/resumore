import { useRef, type CSSProperties, type ReactNode } from "react";
const palettes = {
  Iris: "#5545ac",
  Ocean: "#23659b",
  Forest: "#267057",
  Clay: "#a45135",
  Graphite: "#48515b",
};
export const defaults = {
  accent: palettes.Iris,
  font: "Jakarta",
  shape: "Soft",
  size: "Standard",
  surface: "Neutral",
  density: "Comfortable",
};
export type WorkspaceStyle = typeof defaults;
export function loadWorkspace(): WorkspaceStyle {
  try {
    const v = JSON.parse(localStorage.getItem("resumora-workspace") || "null");
    if (
      v &&
      /^#[a-f0-9]{6}$/i.test(v.accent) &&
      ["Jakarta", "System", "Serif"].includes(v.font) &&
      ["Soft", "Square", "Round"].includes(v.shape) &&
      ["Standard", "Large"].includes(v.size) &&
      ["Neutral", "Tinted"].includes(v.surface) &&
      ["Comfortable", "Compact"].includes(v.density)
    )
      return v;
  } catch {
    /* Defaults work without storage. */
  }
  return defaults;
}
export function workspaceVars(s: WorkspaceStyle): CSSProperties {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(s.accent.slice(i, i + 2), 16) / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  const lum = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return {
    "--selected-accent": s.accent,
    "--on-accent": lum > 0.18 ? "#101019" : "#fff",
    "--control-radius":
      s.shape === "Square" ? "3px" : s.shape === "Round" ? "32px" : "9px",
    "--ui":
      s.font === "Serif"
        ? "Georgia,serif"
        : s.font === "System"
          ? "system-ui,sans-serif"
          : '"Plus Jakarta Sans",Arial,sans-serif',
  } as CSSProperties;
}
export function WorkspaceSettings({
  value,
  change,
  theme,
}: {
  value: WorkspaceStyle;
  change: (v: WorkspaceStyle) => void;
  theme: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  function choice(key: keyof WorkspaceStyle, label: string, options: string[]) {
    return (
      <label>
        {label}
        <select
          value={value[key]}
          onChange={(e) => change({ ...value, [key]: e.target.value })}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <>
      <button
        className="settings-trigger"
        onClick={() => dialog.current?.showModal()}
      >
        Appearance
      </button>
      <dialog
        className="workspace-dialog"
        aria-label="Workspace appearance"
        ref={dialog}
      >
        <header>
          <h2>Workspace appearance</h2>
          <button onClick={() => dialog.current?.close()}>Done</button>
        </header>
        <p>
          Personalize your workspace. CV styling is available under Design &amp;
          appearance.
        </p>
        <fieldset>
          <legend>Color palette</legend>
          <div className="workspace-palettes">
            {Object.entries(palettes).map(([label, color]) => (
              <button
                key={label}
                aria-pressed={value.accent.toLowerCase() === color}
                onClick={() => change({ ...value, accent: color })}
              >
                <i style={{ background: color }} />
                {label}
              </button>
            ))}
          </div>
          <label>
            Custom accent
            <input
              type="color"
              value={value.accent}
              onChange={(e) => change({ ...value, accent: e.target.value })}
            />
          </label>
        </fieldset>
        <div className="workspace-options">
          <label>Theme{theme}</label>
          {choice("surface", "Background", ["Neutral", "Tinted"])}
          {choice("font", "Interface font", ["Jakarta", "System", "Serif"])}
          {choice("size", "Control text", ["Standard", "Large"])}
          {choice("shape", "Button corners", ["Soft", "Square", "Round"])}
          {choice("density", "Control spacing", ["Comfortable", "Compact"])}
        </div>
        <button onClick={() => change({ ...defaults })}>
          Reset workspace style
        </button>
      </dialog>
    </>
  );
}
