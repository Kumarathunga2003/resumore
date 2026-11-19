import { Paper } from "./Paper";
import { initial, type Resume } from "./model";
import { templates, withTemplate } from "./templates";
export function TemplateGallery({
  resume,
  choose,
}: {
  resume?: Resume;
  choose: (id: string) => void;
}) {
  return (
    <div className="template-gallery">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-label={(resume ? "Apply " : "Use ") + t.name}
          aria-pressed={resume ? resume.template === t.id : undefined}
          onClick={() => choose(t.id)}
        >
          <div className="template-swatch" aria-hidden="true">
            <div className="swatch-page">
              <Paper
                resume={withTemplate(
                  resume?.name ||
                    resume?.summary ||
                    resume?.sections.some((s) => s.content || s.entries?.length)
                    ? resume!
                    : initial,
                  t.id,
                )}
              />
            </div>
          </div>
          <strong>{t.name}</strong>
          <small>{t.description}</small>
        </button>
      ))}
    </div>
  );
}
