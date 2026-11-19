import { photoPng } from "./photo";
import pdfMake from "pdfmake/build/pdfmake";
import { pdfDocument } from "./pdfDocument";
import type { Resume } from "./model";
const fontFiles = import.meta.glob<string>("./assets/fonts/*.ttf", {
  eager: true,
  query: "?inline",
  import: "default",
});
export async function resumeBlob(resume: Resume, title: string) {
  const family =
    resume.font === "Plus Jakarta Sans"
      ? "Jakarta"
      : resume.font === "Georgia"
        ? "LiberationSerif"
        : "LiberationSans";
  const vfs: Record<string, string> = {};
  const fonts: Record<
    string,
    { normal: string; bold: string; italics: string; bolditalics: string }
  > = {};
  for (const name of ["Jakarta", "LiberationSans", "LiberationSerif"]) {
    const italicFamily = name === "Jakarta" ? "LiberationSans" : name;
    fonts[name] = {
      normal: name + "-Regular.ttf",
      bold: name + "-Bold.ttf",
      italics: italicFamily + "-Italic.ttf",
      bolditalics: italicFamily + "-BoldItalic.ttf",
    };
    for (const filename of Object.values(fonts[name]))
      vfs[filename] = fontFiles["./assets/fonts/" + filename].split(",")[1];
  }
  fonts.Document = fonts[family];
  const pdf = pdfMake.createPdf(
    pdfDocument(
      resume,
      title,
      resume.photo ? await photoPng(resume.photo) : undefined,
    ),
    undefined,
    fonts,
    vfs,
  );
  return new Promise<Blob>((resolve) => pdf.getBlob(resolve));
}
export async function downloadResume(resume: Resume, title: string) {
  const blob = await resumeBlob(resume, title);
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download =
    ((title.trim() || resume.name)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .trim() || "Resume") + ".pdf";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
