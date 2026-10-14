import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { markdownToHtml } from "../../src/cv/markdown-to-html.js";

describe("markdownToHtml", () => {
  it("promotes h3 sections when the document has no h2 headings", () => {
    const html = markdownToHtml("# Daniel Sierra\n\n### Experience\n\nDetails");

    assert.match(html, /<h2>Experience<\/h2>/);
    assert.doesNotMatch(html, /<h3>/);
  });

  it("preserves h2 sections and h3 role headings", () => {
    const html = markdownToHtml(
      "## Experience\n\n### Senior Engineer\n\nDetails",
    );

    assert.match(html, /<h2>Experience<\/h2>/);
    assert.match(html, /<h3>Senior Engineer<\/h3>/);
  });

  it("preserves markdown links and lists", () => {
    const html = markdownToHtml(
      "[Portfolio](https://example.com)\n\n- TypeScript\n- React",
    );

    assert.match(html, /<a href="https:\/\/example\.com">Portfolio<\/a>/);
    assert.match(html, /<ul>/);
    assert.match(html, /<li>TypeScript<\/li>/);
    assert.match(html, /<li>React<\/li>/);
  });
});
