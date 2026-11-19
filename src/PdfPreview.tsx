import { useEffect, useState } from "react";
import type { Resume } from "./model";
import { resumeBlob } from "./pdf";
export function PdfPreview({
  resume,
  title,
}: {
  resume: Resume;
  title: string;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(false);
  useEffect(() => {
    let live = true,
      generated = "";
    setUrl("");
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const blob = await resumeBlob(resume, title);
        if (live) {
          generated = URL.createObjectURL(blob);
          setUrl(generated);
        }
      } catch {
        if (live) setError(true);
      }
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
      if (generated) URL.revokeObjectURL(generated);
    };
  }, [resume, title]);
  if (!url)
    return (
      <p role="status">
        {error ? "Could not generate the page preview." : "Preparing pages…"}
      </p>
    );
  return (
    <div>
      <iframe
        className="pdf-pages"
        title="PDF page-break preview"
        src={url + "#view=FitH"}
      />
      <a href={url} target="_blank" rel="noreferrer">
        Open pages in a new tab
      </a>
    </div>
  );
}
