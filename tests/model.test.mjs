import test from "node:test";
import assert from "node:assert/strict";
import { draft, fromBackup, validResume } from "../src/model.ts";
test("blank and sample documents have independent sections", () => {
  const blank = draft(),
    sample = draft(true);
  assert.equal(blank.resume.name, "");
  assert.ok(sample.resume.sections[0].content);
  assert.notEqual(blank.id, sample.id);
});
test("backup imports as a distinct document with identical content", () => {
  const a = draft(true),
    b = fromBackup(JSON.parse(JSON.stringify(a)));
  assert.notEqual(a.id, b.id);
  assert.deepEqual(a.resume, b.resume);
});
test("rejects malformed nested data, duplicate sections and unknown versions", () => {
  const a = draft();
  assert.throws(() => fromBackup({ ...a, version: 2 }));
  a.resume.sections[0].entries = [{ id: "a", values: [{}], bullets: "" }];
  assert.equal(validResume(a.resume), false);
  delete a.resume.sections[0].entries;
  a.resume.sections.push(a.resume.sections[0]);
  assert.equal(validResume(a.resume), false);
});
import { analyze, keywordHints } from "../src/analysis.ts";
test("keyword checks ignore hidden content, names and partial matches", () => {
  const r = draft().resume;
  r.name = "Python";
  r.sections[0].content = "JavaScript and C++";
  r.sections[1].content = "Python";
  r.sections[1].enabled = false;
  const result = analyze(r, "Java Python C++ JavaScript JavaScript");
  assert.deepEqual(result.matched, ["c++", "javascript"]);
  assert.deepEqual(result.missing, ["java", "python"]);
  assert.ok(result.tips.length);
});
import { designOf, visibleContacts, webAddress } from "../src/model.ts";
test("presets contain only design settings and preserve document content", () => {
  const a = draft(true).resume,
    b = draft().resume;
  a.bodySize = 15;
  a.mode = "creative";
  const d = designOf(a);
  assert.equal(d.bodySize, 15);
  const result = { ...b, ...d };
  assert.deepEqual(result.sections, b.sections);
  assert.equal(result.name, "");
  assert.equal(result.mode, "creative");
  assert.ok(!("website" in d));
});
test("old and new backups preserve contacts, visibility and typography", () => {
  const a = draft(true);
  assert.equal(fromBackup(a).resume.website, a.resume.website);
  Object.assign(a.resume, {
    github: "github.com/example",
    linkedin: "linkedin.com/in/example",
    hiddenContacts: ["linkedin", "phone"],
    bodySize: 13,
  });
  const imported = fromBackup(a).resume;
  assert.ok(visibleContacts(imported).some((c) => c.key === "github"));
  assert.ok(
    !visibleContacts(imported).some(
      (c) => c.key === "phone" || c.key === "linkedin",
    ),
  );
  assert.equal(imported.linkedin, a.resume.linkedin);
  assert.equal(imported.bodySize, 13);
  for (const invalid of [
    { nameSize: 500 },
    { lineHeight: "2" },
    { hiddenContacts: ["not-a-contact"] },
    { github: 2 },
  ])
    assert.throws(() =>
      fromBackup({ ...a, resume: { ...a.resume, ...invalid } }),
    );
});
test("web links accept HTTP(S) and keep unsupported addresses as plain text", () => {
  assert.equal(webAddress("github.com/example"), "https://github.com/example");
  for (const val of [
    "javascript:alert(1)",
    "data:text/html,x",
    "ftp://example.com",
    "https://user:password@example.com",
    "not a url",
  ])
    assert.equal(webAddress(val), undefined);
});
import { pdfDocument } from "../src/pdfDocument.ts";
test("PDF output uses only visible resume data and excludes browser furniture", () => {
  const r = draft(true).resume;
  r.website = "example.com/private";
  r.hiddenContacts = ["website"];
  r.sections[0].enabled = false;
  r.paper = "Letter";
  r.pageMargin = 12;
  const d = pdfDocument(r),
    data = JSON.stringify(d.content);
  assert.equal(d.pageSize, "LETTER");
  assert.equal(d.pageMargins, (12 * 72) / 25.4);
  assert.ok(!d.header && !d.footer);
  assert.ok(!data.includes("example.com/private"));
  assert.ok(!data.includes("NSBM"));
  assert.ok(data.includes("GAWEESHA"));
  assert.ok(data.includes("Tamil"));
});
test("invalid colors, margins, heading scale and alignment cannot enter via backup", () => {
  const a = draft();
  for (const invalid of [
    { textColor: "red" },
    { ruleColor: 5 },
    { headerAlign: "top" },
    { pageMargin: 99 },
    { headingSize: 0 },
  ])
    assert.throws(() =>
      fromBackup({ ...a, resume: { ...a.resume, ...invalid } }),
    );
});
test("job versions retain their posting and project links in backups while PDFs omit the posting", () => {
  const original = draft(true);
  const copy = fromBackup(JSON.parse(JSON.stringify(original)));
  copy.resume.jobDescription = "Private vacancy text";
  copy.resume.sections.find(s=>s.id==="projects").entries = [{
    id:"project",values:["Course planner","Developer","Flutter","","https://example.org/repo","https://example.org/demo"],bullets:"Built the timetable"
  }];
  const restored = fromBackup(JSON.parse(JSON.stringify(copy)));
  assert.equal(restored.resume.jobDescription,copy.resume.jobDescription);
  assert.equal(original.resume.jobDescription,undefined);
  assert.equal(validResume({...copy.resume,jobDescription:123}),false);
  const content = pdfDocument(restored.resume).content;
  assert.ok(content.some(item=>item.link==="https://example.org/repo"));
  assert.ok(content.some(item=>item.link==="https://example.org/demo"));
  assert.ok(!JSON.stringify(content).includes(copy.resume.jobDescription));
});
test("job review matches common skill names and ignores filler words",()=>{
 const r=draft().resume;r.summary="Used JavaScript and Node.js";
 const result=analyze(r,"We need JS, NodeJS, C# and Power BI.");
 assert.deepEqual(result.matched,["javascript","nodejs"]);
 assert.deepEqual(result.missing,["c#","power-bi"]);
 assert.ok(result.tips.some(s=>s.includes("skills")));
});

test("nearby job words stay missing until the CV is corrected",()=>{
 const r=draft().resume;r.summary="Used Splnuk and Python";
 assert.deepEqual(analyze(r,"Splunk Python").missing,["splunk"]);
 assert.deepEqual(keywordHints(r,["splunk"]),[{wanted:"splunk",written:"splnuk"}]);
});
