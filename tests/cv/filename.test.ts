import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cvFilenameFromMarkdown,
  cvTitleFromMarkdown,
} from "../../src/cv/filename.js";

describe("cvFilenameFromMarkdown", () => {
  it("slugifies the first heading", () => {
    assert.equal(
      cvFilenameFromMarkdown("# Daniel Sierra\n\nRole"),
      "Daniel-Sierra.pdf",
    );
  });

  it("uses cv.pdf when there is no heading", () => {
    assert.equal(cvFilenameFromMarkdown("Just a paragraph"), "cv.pdf");
  });

  it("uses cv.pdf when the heading has no filename-safe characters", () => {
    assert.equal(cvFilenameFromMarkdown("# !!!"), "cv.pdf");
  });
});

describe("cvTitleFromMarkdown", () => {
  it("reads the first heading", () => {
    assert.equal(cvTitleFromMarkdown("# Daniel Sierra\n\nRole"), "Daniel Sierra");
  });

  it("falls back to CV when there is no heading", () => {
    assert.equal(cvTitleFromMarkdown("Just a paragraph"), "CV");
  });
});
