import test from "node:test";
import assert from "node:assert/strict";
import { draft } from "../src/model.ts";
import { issues, passages, revise } from "../src/writing.ts";
import { rewrite, availability } from "../src/localWriter.ts";
test("writing checks handle case, whole words and line boundaries", () => {
  const flags = issues(
    "Recieved the the file in order to deploy.\nThe\ntheatre",
  );
  assert.deepEqual(
    flags.map((f) => f.after),
    ["Received", "the", "to"],
  );
});
test("corrections retain styling, ignore stale suggestions and exclude hidden sections", () => {
  const r = draft(true).resume;
  r.summary = "Teh app";
  r.summaryMarks = [{ start: 4, end: 7, style: 1 }];
  r.sections[0].enabled = false;
  const fields = passages(r);
  assert.ok(!fields.some((p) => p.section === r.sections[0].id));
  const p = fields.find((p) => p.id === "summary");
  const n = revise(r, p, "The app", 3);
  assert.deepEqual(n.summaryMarks, r.summaryMarks);
  assert.equal(revise(n, p, "Old text"), n);
});
test("model adapter uses only the chosen passage and releases the session", async () => {
  let released = false,
    input = "";
  globalThis.LanguageModel = {
    availability: async () => "available",
    create: async () => ({
      prompt: async (t) => {
        input = t;
        return "Built the app.";
      },
      destroy: () => {
        released = true;
      },
    }),
  };
  try {
    assert.equal(await availability(), "available");
    assert.equal(
      await rewrite(
        "I built the app.",
        "Fix grammar",
        new AbortController().signal,
      ),
      "Built the app.",
    );
    assert.ok(input.includes("I built the app."));
    assert.ok(released);
  } finally {
    delete globalThis.LanguageModel;
  }
  assert.equal(await availability(), "unavailable");
});
test("offline checks suggest new corrections and leave links and technical identifiers alone",()=>{
 const edits=issues("I has used Pythno for documentatoin and comunication. See https://example.org/documentatoin. I built a Kubernetes API.");
 assert.deepEqual(edits.map(i=>i.after),["I have","Python","documentation","communication"]);
});

test("review explains each underlined word in the reported sentence", () => {
  const edits = issues("built teh app adn sijs xcsw pythono");
  assert.deepEqual(edits.map(e => [e.before, e.after]), [
    ["teh", "the"], ["adn", "and"], ["sijs", ""], ["xcsw", ""], ["pythono", "Python"]
  ]);
  assert.deepEqual(issues("https://example.org/teh/adn teh@example.org SQL HTML"), []);
});

test("short unfamiliar words get manual review alongside specific corrections", () => {
  const flags = issues("fsr adn dfs sijs xcsw.");
  assert.deepEqual(flags.map(i => [i.before, i.after]), [
    ["fsr", ""], ["adn", "and"], ["dfs", ""], ["sijs", ""], ["xcsw", ""]
  ]);
});
