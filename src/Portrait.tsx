import { useEffect, useRef, useState } from "react";
import {
  aspectOf,
  drawPhoto,
  frames,
  newPhoto,
  normalizePhoto,
  readImage,
  type Photo,
} from "./photo";
export function Portrait({ photo: p }: { photo: Photo }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let live = true;
    readImage(p.source)
      .then((im) => {
        if (live) setImage(im);
      })
      .catch(() => {
        if (live) setImage(null);
      });
    return () => {
      live = false;
    };
  }, [p.source]);
  useEffect(() => {
    if (canvas.current && image && image.src === p.source)
      drawPhoto(canvas.current, image, p);
  }, [p, image]);
  return (
    <canvas
      role="img"
      aria-label="CV profile photo"
      ref={canvas}
      style={{
        width: p.size,
        height: p.size / aspectOf(p),
        verticalAlign: "middle",
      }}
    />
  );
}
export function PhotoControls({
  photo,
  change,
}: {
  photo?: Photo;
  change: (p?: Photo) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw Error("Choose a JPG, PNG or WebP picture.");
      const source = await normalizePhoto(file);
      change(
        photo ? { ...photo, source, zoom: 1, x: 50, y: 50 } : newPhoto(source),
      );
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("Choose")
          ? e.message
          : "This image could not be opened. Try a JPG, PNG or WebP picture.",
      );
    } finally {
      setBusy(false);
    }
  }
  function slider(
    key: "size" | "zoom" | "x" | "y" | "aspect" | "radius",
    label: string,
    min: number,
    max: number,
    step: number,
    suffix: string,
  ) {
    if (!photo) return null;
    return (
      <label>
        {label}
        <output>
          {photo[key]}
          {suffix}
        </output>
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={photo[key]}
          onChange={(e) => change({ ...photo, [key]: Number(e.target.value) })}
        />
      </label>
    );
  }
  return (
    <section className="photo-controls">
      <h3>Profile photo</h3>
      <input
        hidden
        ref={input}
        aria-label="Choose photo file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void load(f);
        }}
      />
      <div className="photo-actions">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? "Opening image…" : photo ? "Replace photo" : "Add photo"}
        </button>
        {photo && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change(undefined)}
          >
            Remove photo
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {photo && (
        <>
          <div className="photo-stage">
            <Portrait photo={photo} />
          </div>
          <fieldset>
            <legend>Frame shape</legend>
            <div className="photo-actions">
              {frames.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === photo.shape}
                  onClick={() => change({ ...photo, shape: s })}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="photo-sliders">
            {slider("size", "Photo width", 52, 160, 2, " px")}
            {slider("zoom", "Crop zoom", 1, 3, 0.05, "×")}
            {slider("x", "Horizontal crop", 0, 100, 1, "%")}
            {slider("y", "Vertical crop", 0, 100, 1, "%")}
            {photo.shape === "Custom" && (
              <>
                {slider("aspect", "Width to height", 0.65, 1.6, 0.05, "")}
                {slider("radius", "Corner radius", 0, 50, 1, "%")}
              </>
            )}
          </div>
          <fieldset>
            <legend>Header position</legend>
            <div className="photo-actions">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  type="button"
                  aria-pressed={!photo.placement && photo.align === a}
                  key={a}
                  onClick={() =>
                    change({ ...photo, align: a, placement: undefined })
                  }
                >
                  {a === "center"
                    ? "Above name"
                    : a === "left"
                      ? "Beside name, left"
                      : "Beside name, right"}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </section>
  );
}
