import { coachReport, requirementLines, evidenceFor } from "./coach.ts";
import type { Resume } from "./model.ts";
export function photoAdvice(r: Resume) {
  const align = r.headerAlign ?? (r.mode === "ats" ? "center" : "left");
  const reason =
    align === "center"
      ? "Center the photo above your name to match your centered heading."
      : `Place the photo at the upper ${align} so its edge lines up with your name and contact details.`;
  return { align, reason };
}
export function guideReply(r: Resume, question: string) {
  if (/\b(photo|portrait|headshot|picture)\b/i.test(question))
    return (
      (r.photo ? "" : "Open Personal details and choose Add photo. ") +
      photoAdvice(r).reason +
      " A header position reserves space and keeps text readable. For a custom spot, drag your photo in Edit on CV and check Page breaks for overlap."
    );
  const report = coachReport(r);
  if (/keyword|missing|match|coverage|gap|requirement/i.test(question)) {
    if (!report.count)
      return "Open Job requirements and enter the employer’s requirements. I can then compare those terms with the visible sections of your CV.";
    return (
      `Your CV includes ${report.matched.length} of ${report.count} distinct job terms (${report.percentage}%). ` +
      (report.missing.length
        ? "Review these terms: " +
          report.missing.slice(0, 10).join(", ") +
          ". Add an example only where you have relevant experience."
        : "Every counted term appears. Check whether each one has a concrete example.")
    );
  }
  if (/interview|practice/i.test(question)) {
    const req = requirementLines(r.jobDescription || "")[0];
    const excerpt = req ? evidenceFor(r, req) : undefined;
    return (
      (req
        ? "Practice question: “Tell me about a time you demonstrated " +
          req +
          ".”"
        : "Practice question: “Which project best shows what you could contribute to this role?”") +
      (excerpt
        ? " Start with this example from " +
          excerpt.label +
          ": “" +
          excerpt.text.slice(0, 200) +
          "”."
        : " Pick a course, project or work example.") +
      " Explain what you personally did and how you checked the result."
    );
  }
  if (/project|bullet/i.test(question))
    return "For a project bullet, name the feature you built, the tools you used and one result you verified. Use Projects to add the entry and its demo or repository.";
  if (/summary|rewrite|grammar|spelling/i.test(question))
    return "Open Writing checks to review wording. For a summary, name your field, a relevant skill and one example that supports your target role.";
  if (/review|improve|priority|next|start/i.test(question))
    return report.tips.length
      ? "Your next edit: " + report.tips[0]
      : "Your basic content checks are clear. Choose your strongest project and add one sentence about the outcome.";
  return "The built-in guide can review your CV, find missing job terms, help with a project bullet or give you an interview question. Choose one of those topics.";
}
