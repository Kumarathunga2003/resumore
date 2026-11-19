export const frames = [
  "Circle",
  "Oval",
  "Square",
  "Rounded",
  "Diamond",
  "Hexagon",
  "Custom",
] as const;
export type Photo = {
  placement?: { x: number; y: number };
  source: string;
  shape: (typeof frames)[number];
  size: number;
  zoom: number;
  x: number;
  y: number;
  aspect: number;
  radius: number;
  align: "left" | "center" | "right";
};
export function newPhoto(source: string): Photo {
  return {
    source,
    shape: "Circle",
    size: 96,
    zoom: 1,
    x: 50,
    y: 50,
    aspect: 1,
    radius: 20,
    align: "center",
  };
}
export function validPhoto(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const p = value as Photo;
  const between = (v: number, min: number, max: number) =>
    Number.isFinite(v) && v >= min && v <= max;
  return (
    typeof p.source === "string" &&
    p.source.length < 1500000 &&
    /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(p.source) &&
    (p.placement === undefined ||
      (!!p.placement &&
        between(p.placement.x, 0, 1) &&
        between(p.placement.y, 0, 1))) &&
    frames.includes(p.shape) &&
    ["left", "center", "right"].includes(p.align) &&
    between(p.size, 52, 160) &&
    between(p.zoom, 1, 3) &&
    between(p.x, 0, 100) &&
    between(p.y, 0, 100) &&
    between(p.aspect, 0.65, 1.6) &&
    between(p.radius, 0, 50)
  );
}
export const aspectOf = (p: Photo) =>
  p.shape === "Oval" ? 0.8 : p.shape === "Custom" ? p.aspect : 1;
export function photoTravel(photo: Photo, paper?: "A4" | "Letter") {
  const width = paper === "Letter" ? 816 : 595.28 / 0.75;
  const height = paper === "Letter" ? 1056 : 841.89 / 0.75;
  return { x: width - photo.size, y: height - photo.size / aspectOf(photo) };
}
// Resolve header drops at render time so older saved positions get the same protection.
export function headerPhotoSlot(
  photo: Photo,
  paper?: "A4" | "Letter",
  margin = 18,
) {
  if (!photo.placement) return photo.align;
  const travel = photoTravel(photo, paper);
  const headerBottom =
    (margin * 96) / 25.4 + Math.max(140, photo.size / aspectOf(photo));
  if (photo.placement.y * travel.y > headerBottom) return undefined;
  return photo.placement.x < 0.35
    ? "left"
    : photo.placement.x > 0.65
      ? "right"
      : "center";
}
export async function readImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
export async function normalizePhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await readImage(url);
    const scale = Math.min(1, 960 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function drawPhoto(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  p: Photo,
) {
  const w = 480,
    h = Math.round(w / aspectOf(p));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.save();
  ctx.beginPath();
  if (p.shape === "Circle" || p.shape === "Oval")
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (p.shape === "Diamond" || p.shape === "Hexagon") {
    const points =
      p.shape === "Diamond"
        ? [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5],
          ]
        : [
            [0.25, 0],
            [0.75, 0],
            [1, 0.5],
            [0.75, 1],
            [0.25, 1],
            [0, 0.5],
          ];
    points.forEach(([x, y], i) =>
      i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h),
    );
    ctx.closePath();
  } else
    ctx.roundRect(
      0,
      0,
      w,
      h,
      Math.min(w, h) *
        (p.shape === "Rounded"
          ? 0.2
          : p.shape === "Custom"
            ? p.radius / 100
            : 0),
    );
  ctx.clip();
  const scale = Math.max(w / image.width, h / image.height) * p.zoom,
    iw = image.width * scale,
    ih = image.height * scale;
  ctx.drawImage(image, ((w - iw) * p.x) / 100, ((h - ih) * p.y) / 100, iw, ih);
  ctx.restore();
}
export async function photoPng(p: Photo) {
  const canvas = document.createElement("canvas");
  drawPhoto(canvas, await readImage(p.source), p);
  return canvas.toDataURL("image/png");
}
