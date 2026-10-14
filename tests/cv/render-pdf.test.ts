import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCvDocument } from "../../src/cv/document.js";

describe("buildCvDocument", () => {
  it("wraps CV HTML with the document title and stylesheet", () => {
    const html = buildCvDocument("<h1>Daniel Sierra</h1>", "Daniel Sierra");

    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<title>Daniel Sierra<\/title>/);
    assert.match(html, /<main><h1>Daniel Sierra<\/h1><\/main>/);
    assert.match(html, /@page/);
    assert.match(html, /width: 210mm/);
    assert.match(html, /padding: 12mm 14mm 13mm/);
    assert.match(html, /font-family: Georgia/);
  });

  it("escapes the document title", () => {
    const html = buildCvDocument("<p>Body</p>", `A & B <C> "D"`);

    assert.match(html, /<title>A &amp; B &lt;C&gt; &quot;D&quot;<\/title>/);
  });
});
