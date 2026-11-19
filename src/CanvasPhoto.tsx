import { useRef, useState } from "react";
import { Portrait } from "./Portrait";
import { photoTravel, type Photo } from "./photo";
type Point = { x: number; y: number };
const clamp = (value: number, limit: number) =>
  Math.max(0, Math.min(limit, value));

export function CanvasPhoto({
  photo,
  paper,
  slot,
  move,
}: {
  photo: Photo;
  paper?: "A4" | "Letter";
  slot?: Photo["align"];
  move?: (position: Point) => void;
}) {
  const travel = photoTravel(photo, paper);
  const drag = useRef<{
    id: number;
    start: Point;
    origin: Point;
    scale: number;
    moved: boolean;
  } | null>(null);
  const [offset, setOffset] = useState<Point | null>(null);
  const placement = slot ? undefined : photo.placement;
  const style: React.CSSProperties = placement
    ? {
        position: "absolute",
        left: placement.x * travel.x,
        top: placement.y * travel.y,
        zIndex: 1,
      }
    : {};
  const geometry = (el: HTMLElement) => {
    const page = el.closest("article")!;
    const rect = page.getBoundingClientRect(),
      box = el.getBoundingClientRect();
    const scale = rect.width / page.offsetWidth;
    return {
      scale,
      origin: {
        x: (box.left - rect.left) / scale,
        y: (box.top - rect.top) / scale,
      },
    };
  };
  const commit = (x: number, y: number) =>
    move?.({
      x: clamp(x, travel.x) / travel.x,
      y: clamp(y, travel.y) / travel.y,
    });
  const image = <Portrait photo={photo} />;
  const item = move ? (
    <button
      type="button"
      className="canvas-portrait"
      aria-label="Move profile photo"
      title="Drag to place the photo. Use the left and right arrow keys to choose a header position."
      style={{
        ...style,
        transform: offset
          ? `translate(${offset.x}px,${offset.y}px)`
          : undefined,
      }}
      onKeyDown={(e) => {
        const dirs: Record<string, Point> = {
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
        };
        const dir = dirs[e.key];
        if (!dir) return;
        e.preventDefault();
        const { origin } = geometry(e.currentTarget),
          step = e.shiftKey ? 10 : 1;
        if (slot && dir.x) {
          const positions = [0, 0.5, 1];
          const current = ["left", "center", "right"].indexOf(slot);
          move?.({ x: positions[clamp(current + dir.x, 2)], y: 0 });
        } else if (slot && dir.y > 0) {
          const header = e.currentTarget.closest("header")!;
          const page = e.currentTarget.closest("article")!;
          commit(
            origin.x,
            Math.max(
              origin.y + 260,
              (header.getBoundingClientRect().bottom -
                page.getBoundingClientRect().top) /
                geometry(e.currentTarget).scale +
                8,
            ),
          );
        } else commit(origin.x + dir.x * step, origin.y + dir.y * step);
      }}
      onPointerDown={(e) => {
        if (!e.isPrimary || e.button !== 0) return;
        drag.current = {
          ...geometry(e.currentTarget),
          id: e.pointerId,
          start: { x: e.clientX, y: e.clientY },
          moved: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.start.x,
          dy = e.clientY - d.start.y;
        if (!d.moved && Math.hypot(dx, dy) < 3) return;
        d.moved = true;
        setOffset({
          x: clamp(d.origin.x + dx / d.scale, travel.x) - d.origin.x,
          y: clamp(d.origin.y + dy / d.scale, travel.y) - d.origin.y,
        });
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        setOffset(null);
        if (d.moved)
          commit(
            d.origin.x + (e.clientX - d.start.x) / d.scale,
            d.origin.y + (e.clientY - d.start.y) / d.scale,
          );
      }}
      onLostPointerCapture={() => {
        drag.current = null;
        setOffset(null);
      }}
    >
      {image}
    </button>
  ) : (
    <span style={style}>{image}</span>
  );
  return placement ? (
    item
  ) : (
    <div style={{ textAlign: slot ?? photo.align, marginBottom: 8 }}>
      {item}
    </div>
  );
}
