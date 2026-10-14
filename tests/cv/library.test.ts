import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { MAX_MARKDOWN_BYTES } from "../../src/cv/site.js";
import {
  cvDocLabel,
  defaultCvDocsCandidates,
  listCvDocs,
  readCvDoc,
  resolveCvDocsDir,
} from "../../src/cv/library.js";

describe("cvDocLabel", () => {
  it("turns saved filenames into role names", () => {
    assert.equal(cvDocLabel("Daniel_Sierra_CV_Project_Manager.md"), "Project Manager");
    assert.equal(cvDocLabel("Daniel_Sierra_FDE_CV.md"), "FDE");
    assert.equal(
      cvDocLabel("Daniel_Sierra_Senior_Fullstack_AI_Engineer_CV.md"),
      "Senior Fullstack AI Engineer",
    );
    assert.equal(cvDocLabel("Daniel_Sierra_Bartender.md"), "Bartender");
    assert.equal(cvDocLabel("Other_Role.md"), "Other Role");
  });
});

describe("defaultCvDocsCandidates", () => {
  it("prefers CV_DOCS_DIR, then the repo docs folder beside or above the working directory", () => {
    assert.deepEqual(defaultCvDocsCandidates("/app/web", "/app/data/cv/docs"), [
      "/app/data/cv/docs",
      path.resolve("/app/web", "data", "cv", "docs"),
      path.resolve("/app/web", "..", "data", "cv", "docs"),
    ]);
    assert.deepEqual(defaultCvDocsCandidates("/app/web", ""), [
      path.resolve("/app/web", "data", "cv", "docs"),
      path.resolve("/app/web", "..", "data", "cv", "docs"),
    ]);
  });
});

describe("cv docs library", () => {
  it("lists markdown files and reads one by id", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cv-docs-"));

    try {
      await writeFile(
        path.join(dir, "Daniel_Sierra_FDE_CV.md"),
        "# Daniel Sierra\n\nFDE",
      );
      await writeFile(
        path.join(dir, "Daniel_Sierra_CV_Project_Manager.md"),
        "# Daniel Sierra\n\nProject",
      );
      await writeFile(path.join(dir, "notes.txt"), "skip");

      assert.deepEqual(await listCvDocs(dir), [
        { id: "Daniel_Sierra_FDE_CV", label: "FDE" },
        { id: "Daniel_Sierra_CV_Project_Manager", label: "Project Manager" },
      ]);

      assert.deepEqual(await readCvDoc(dir, "Daniel_Sierra_FDE_CV"), {
        ok: true,
        markdown: "# Daniel Sierra\n\nFDE",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects ids that leave the docs directory", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cv-docs-"));

    try {
      for (const id of ["../secret", "..", "foo/bar", "", "Daniel Sierra"]) {
        assert.deepEqual(await readCvDoc(dir, id), {
          ok: false,
          status: 404,
          message: "That CV is not in the saved list.",
        });
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects a saved file larger than 200 KB", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cv-docs-"));

    try {
      await writeFile(path.join(dir, "Huge.md"), "x".repeat(MAX_MARKDOWN_BYTES + 1));

      assert.deepEqual(await readCvDoc(dir, "Huge"), {
        ok: false,
        status: 413,
        message: "Markdown is larger than 200 KB.",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("uses the first candidate that is a directory", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "cv-docs-"));

    try {
      assert.equal(
        await resolveCvDocsDir([path.join(dir, "missing"), dir]),
        dir,
      );
      assert.equal(await resolveCvDocsDir([path.join(dir, "missing")]), null);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
