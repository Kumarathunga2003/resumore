import test from "node:test";
import assert from "node:assert/strict";
import { newPhoto, validPhoto, photoTravel } from "../src/photo.ts";
import { pdfDocument } from "../src/pdfDocument.ts";
import { photoAdvice } from "../src/assistantGuide.ts";
import * as model from "../src/model.ts";
test("Free placement and header alignment survive validation independently of crop", () => {
  const photo = newPhoto("data:image/jpeg;base64,/9j/AAAA");
  assert.ok(validPhoto(photo));
  assert.ok(validPhoto({ ...photo, placement: { x: 0, y: 1 } }));
  assert.equal(validPhoto({ ...photo, placement: { x: -1, y: 1 } }), false);
  assert.equal(validPhoto({ ...photo, placement: null }), false);
});
for (const paper of ["A4", "Letter"])
  test(
    paper + " export uses first-page coordinates and respects the photo bounds",
    () => {
      const r = model.draft().resume;
      r.paper = paper;
      r.photo = {
        ...newPhoto("data:image/jpeg;base64,/9j/AAAA"),
        shape: "Oval",
        placement: { x: 1, y: 1 },
      };
      const saved = model.fromBackup({ ...model.draft(), resume: r }).resume;
      assert.deepEqual(saved.photo, r.photo);
      const img = pdfDocument(saved, "CV", "photo").content.find(
        (n) => n.image,
      );
      const bounds = photoTravel(r.photo, paper);
      assert.deepEqual(img.absolutePosition, {
        x: bounds.x * 0.75,
        y: bounds.y * 0.75,
      });
      assert.ok(
        Math.abs(
          img.absolutePosition.y +
            (r.photo.size / 0.8) * 0.75 -
            (paper === "Letter" ? 792 : 841.89),
        ) < 0.001,
      );
      r.headerAlign = "right";
      assert.equal(photoAdvice(r).align, "right");
      delete r.photo.placement;
      assert.equal(
        pdfDocument(r, "CV", "photo").content.find((n) => n.image)
          .absolutePosition,
        undefined,
      );
    },
  );
for (const side of ["left", "right"])
  test("Saved upper " + side + " photo reserves its own PDF column", () => {
    const r = model.draft(true).resume;
    r.photo = {
      ...newPhoto("data:image/jpeg;base64,/9j/AAAA"),
      placement: { x: side === "right" ? 0.96 : 0.04, y: 0.06 },
    };
    const content = pdfDocument(r, "CV", "portrait").content;
    const row = content.find((n) => n.columns);
    const portrait = row.columns[side === "left" ? 0 : 1],
      text = row.columns[side === "left" ? 1 : 0];
    assert.equal(portrait.image, "portrait");
    assert.ok(text.stack.some((n) => n.text === r.name.toUpperCase()));
    assert.ok(row.columnGap > 0);
    assert.equal(
      content.some((n) => n.absolutePosition),
      false,
    );
  });
