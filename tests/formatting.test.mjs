import test from "node:test";
import assert from "node:assert/strict";
import {
  markSelection,
  runs,
  validMarks,
  editMarks,
  bold,
  underline,
} from "../src/emphasis.ts";
import { draft, fromBackup } from "../src/model.ts";
import { pdfDocument } from "../src/pdfDocument.ts";

test("format one word, combine styles, remove each independently", () => {
  const text = "Plan build test";
  let marks = markSelection(text, [], 5, 10, bold);
  marks = markSelection(text, marks, 5, 7, underline);
  assert.deepEqual(
    marks.map((m) => m.style),
    [3, 1],
  );
  marks = markSelection(text, marks, 5, 7, bold);
  assert.deepEqual(
    marks.map((m) => m.style),
    [2, 1],
  );
  assert.deepEqual(markSelection(text, marks, 0, text.length, 0), []);
  assert.equal(
    runs(text, marks)
      .map((r) => r.text)
      .join(""),
    text,
  );
});
test("typing and deleting around a styled word keeps offsets aligned", () => {
  const marks = [{ start: 2, end: 5, style: bold }];
  assert.deepEqual(editMarks("a cat", "a big cat", marks, 6), [
    { start: 6, end: 9, style: bold },
  ]);
  assert.deepEqual(editMarks("a cat", "a coat", marks, 4), [
    { start: 2, end: 6, style: bold },
  ]);
  assert.deepEqual(editMarks("a cat", "a ", marks, 2), []);
  assert.equal(validMarks([{ start: 0, end: 7, style: 3 }], 5), false);
});
test("formatted sample survives backup and is present in the PDF definition", () => {
  const d = draft(true);
  d.resume.summaryMarks = [{ start: 0, end: 1, style: 3 }];
  const restored = fromBackup(JSON.parse(JSON.stringify(d)));
  const content = pdfDocument(restored.resume).content;
  assert.ok(
    content.some(
      (block) =>
        Array.isArray(block.text) &&
        block.text.some(
          (run) =>
            run.text === "I" && run.bold && run.decoration === "underline",
        ),
    ),
  );
  d.resume.summaryMarks[0].end = 99999;
  assert.throws(() => fromBackup(d));
});

import { safeLink, rangeEdit, italic, strike } from "../src/emphasis.ts";
test("links and rich styles survive edits, backup, lists and PDF export", () => {
  const doc = draft(true),
    text = "Portfolio\nProjects";
  doc.resume.summary = text;
  const style = {
    font: "LiberationSerif",
    fontSize: 15,
    color: "#113344",
    background: "#ffffaa",
    characterSpacing: 1,
    style: italic | strike,
    link: "https://example.org/projects",
  };
  const marks = rangeEdit(text, [], 0, 9, () => style);
  doc.resume.summaryMarks = marks;
  doc.resume.summaryBlock = {
    list: "number",
    alignment: "right",
    indent: 1,
    lineHeight: 1.5,
  };
  assert.deepEqual(editMarks(text, "My " + text, marks, 3), [
    { ...style, start: 3, end: 12 },
  ]);
  const pdf = pdfDocument(fromBackup(doc).resume, "Portfolio CV");
  const list = pdf.content.find((x) => x.ol);
  assert.equal(pdf.info.title, "Portfolio CV");
  assert.equal(list.alignment, "right");
  assert.equal(list.ol[0].text[0].link, style.link);
  assert.equal(list.ol[0].text[0].italics, true);
  assert.equal(list.ol[1].text[0].link, undefined);
  for (const link of [
    "javascript:alert(1)",
    "file:///private",
    "https://me:pass@example.com",
  ])
    assert.equal(safeLink(link), undefined);
});
test("older personal drafts lose only the stock experience text", () => {
  const doc = draft(true);
  assert.ok(!doc.resume.sections.some((s) => s.id === "experience"));
  const old = {
    id: "experience",
    label: "Work Experience",
    enabled: true,
    content: "One year of work experience in communication.",
  };
  doc.resume.sections.push(old);
  assert.ok(
    !fromBackup(doc).resume.sections.some((s) => s.id === "experience"),
  );
  old.entries = [{ id: "real", values: ["My new job"], bullets: "" }];
  const recovered = fromBackup(doc).resume.sections.at(-1);
  assert.equal(recovered.content, "");
  assert.deepEqual(recovered.entries, old.entries);
});

import {templates,withTemplate} from "../src/templates.ts";
test("all template switches preserve entered content, inline marks and backup readability",()=>{
 const d=draft(true);
 d.resume.summaryMarks=[{start:0,end:1,style:4}];
 const original=structuredClone(d.resume);
 for(const t of templates){
  d.resume=withTemplate(d.resume,t.id);
  assert.equal(d.resume.name,original.name);
  assert.equal(d.resume.summary,original.summary);
  assert.deepEqual(d.resume.summaryMarks,original.summaryMarks);
  assert.deepEqual(d.resume.sections,original.sections);
  assert.equal(fromBackup(d).resume.template,t.id);
 }
});

import {newPhoto,validPhoto,aspectOf} from "../src/photo.ts";
test("photo framing survives template changes and backup import",()=>{
 const d=draft(true),p={...newPhoto("data:image/jpeg;base64,/9j/AA=="),shape:"Custom",aspect:1.5,radius:38,align:"right"};
 d.resume.photo=p;
 for(const t of templates)assert.deepEqual(withTemplate(d.resume,t.id).photo,p);
 assert.deepEqual(fromBackup(d).resume.photo,p);
 assert.equal(aspectOf(p),1.5);
 assert.equal(validPhoto({...p,source:"https://example.com/portrait.jpg"}),false);
 const row=pdfDocument(d.resume,d.title,"framed-png").content.find(x=>x.columns);
 const block=row.columns[1];
 assert.equal(block.width,p.size*.75);
 assert.equal(block.image,"framed-png");
 assert.ok(row.columns[0].stack.length);
});
