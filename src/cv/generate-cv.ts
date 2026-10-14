import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cvDocsDir, cvPdfsDir, repoRoot } from "../paths.js";
import { markdownToHtml } from "./markdown-to-html.js";
import { renderPdf } from "./render-pdf.js";

async function findMarkdownFiles(inputPath?: string): Promise<string[]> {
  if (inputPath) {
    const resolvedPath = path.resolve(repoRoot, inputPath);

    if (path.extname(resolvedPath).toLowerCase() !== ".md") {
      throw new Error(`CV input must be a markdown file: ${inputPath}`);
    }

    return [resolvedPath];
  }

  const entries = await readdir(cvDocsDir, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".md",
    )
    .map((entry) => path.join(cvDocsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function generateCvs(inputPath?: string): Promise<string[]> {
  const inputFiles = await findMarkdownFiles(inputPath);

  if (inputFiles.length === 0) {
    throw new Error(`No markdown CVs found in ${cvDocsDir}`);
  }

  await mkdir(cvPdfsDir, { recursive: true });

  const outputPaths: string[] = [];

  for (const inputFile of inputFiles) {
    const markdown = await readFile(inputFile, "utf8");
    const html = markdownToHtml(markdown);
    const basename = path.basename(inputFile, path.extname(inputFile));
    const outputPath = path.join(cvPdfsDir, `${basename}.pdf`);

    await renderPdf(html, outputPath, basename.replaceAll("_", " "));
    outputPaths.push(outputPath);
    console.log(`Generated ${path.relative(repoRoot, outputPath)}`);
  }

  return outputPaths;
}
