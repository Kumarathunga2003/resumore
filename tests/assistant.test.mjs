import test from "node:test";
import assert from "node:assert/strict";
import {draft} from "../src/model.ts";
import {guideReply} from "../src/assistantGuide.ts";
test("assistant uses visible draft evidence and the saved job",()=>{
 const r=draft().resume;
 assert.match(guideReply(r,"Find missing keywords"),/enter the employer/);
 r.jobDescription="Flutter\nSQL";r.summary="Built a Flutter app.";
 assert.match(guideReply(r,"Find missing keywords"),/50%.*sql/i);
 assert.match(guideReply(r,"Practice an interview"),/Built a Flutter app/);
 assert.match(guideReply(r,"Review my CV"),/next edit/);
 assert.match(guideReply(r,"hello"),/built-in guide/);
});
