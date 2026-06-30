import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateImageFile } from "../src/lib/media/image-upload.js";

describe("image upload validation", () => {
  it("accepts mobile camera roll image files", () => {
    const file = new File(["image"], "logo.png", { type: "image/png" });
    const result = validateImageFile(file, { maxBytes: 1024 });

    assert.equal(result.ok, true);
  });

  it("rejects non-image files and oversized files", () => {
    const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    const bigFile = new File(["123456"], "large.jpg", { type: "image/jpeg" });

    assert.equal(validateImageFile(textFile, { maxBytes: 1024 }).ok, false);
    assert.equal(validateImageFile(bigFile, { maxBytes: 2 }).ok, false);
  });
});
