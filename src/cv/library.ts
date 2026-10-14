import { stat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { MAX_MARKDOWN_BYTES } from "./site.js";

const CV_DOC_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export type CvDocSummary = {
  id: string;
  label: string;
};

export type CvDocRead =
  | { ok: true; markdown: string }
  | { ok: false; status: 404 | 413; message: string };

const missingDoc: CvDocRead = {
  ok: false,
  status: 404,
  message: "That CV is not in the saved list.",
};

export function cvDocLabel(filename: string): string {
  const extension = path.extname(filename);
  let stem = extension.length > 0 ? filename.slice(0, -extension.length) : filename;
  stem = stem.replace(/^Daniel_Sierra_/, "");
  stem = stem.replace(/^CV_/, "");
  stem = stem.replace(/_CV$/, "");
  stem = stem.replace(/_CV_/g, "_");

  return stem.replaceAll("_", " ").trim();
}

export function defaultCvDocsCandidates(
  cwd = process.cwd(),
  envDir = process.env.CV_DOCS_DIR,
): string[] {
  const candidates = [
    envDir,
    path.resolve(cwd, "data", "cv", "docs"),
    path.resolve(cwd, "..", "data", "cv", "docs"),
  ];

  return candidates.filter(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.length > 0,
  );
}

export async function resolveCvDocsDir(
  candidates: readonly string[],
): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);

      if (info.isDirectory()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function idFromFilename(filename: string): string | null {
  if (path.extname(filename).toLowerCase() !== ".md") {
    return null;
  }

  const id = filename.slice(0, -path.extname(filename).length);

  return CV_DOC_ID.test(id) ? id : null;
}

export async function listCvDocs(docsDir: string): Promise<CvDocSummary[]> {
  const entries = await readdir(docsDir, { withFileTypes: true });
  const documents: CvDocSummary[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const id = idFromFilename(entry.name);

    if (id === null) {
      continue;
    }

    documents.push({ id, label: cvDocLabel(entry.name) });
  }

  documents.sort((left, right) => {
    const byLabel = left.label.localeCompare(right.label);

    return byLabel === 0 ? left.id.localeCompare(right.id) : byLabel;
  });

  return documents;
}

export async function readCvDoc(docsDir: string, id: string): Promise<CvDocRead> {
  if (!CV_DOC_ID.test(id)) {
    return missingDoc;
  }

  const root = path.resolve(docsDir);
  const filePath = path.resolve(root, `${id}.md`);

  if (path.dirname(filePath) !== root) {
    return missingDoc;
  }

  try {
    const info = await stat(filePath);

    if (!info.isFile()) {
      return missingDoc;
    }

    if (info.size > MAX_MARKDOWN_BYTES) {
      return {
        ok: false,
        status: 413,
        message: "Markdown is larger than 200 KB.",
      };
    }

    return { ok: true, markdown: await readFile(filePath, "utf8") };
  } catch {
    return missingDoc;
  }
}
