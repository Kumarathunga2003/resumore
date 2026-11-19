import test from "node:test";
import assert from "node:assert/strict";
import { draft, fromBackup } from "../src/model.ts";
import {
  addExample,
  coachReport,
  evidenceFor,
  requirementLines,
  exampleFeedback,
} from "../src/coach.ts";
test("requirements, examples and score follow the visible CV", () => {
  const r = draft().resume;
  r.targetJob = "Intern";
  r.jobDescription = "Flutter\nSQL";
  r.summary = "Flutter";
  assert.deepEqual(requirementLines("- Flutter\n• SQL; Flutter"), [
    "Flutter",
    "SQL",
  ]);
  assert.equal(coachReport(r).percentage, 50);
  assert.equal(evidenceFor(r, "Flutter").text, "Flutter");
  const n = addExample(
    r,
    "projects",
    "Tested SQL queries for a course project.",
  );
  assert.equal(coachReport(n).percentage, 100);
  assert.equal(coachReport(r).percentage, 50);
  n.sections.find((s) => s.id === "projects").enabled = false;
  assert.equal(coachReport(n).percentage, 50);
  assert.equal(evidenceFor(n, "SQL"), undefined);
  assert.equal(
    fromBackup({ ...draft(), resume: n }).resume.targetJob,
    "Intern",
  );
  assert.equal(coachReport({ ...r, jobDescription: "" }).percentage, null);
  assert.match(exampleFeedback(r, "Flutter", "Flutter"), /specific task/);
});
