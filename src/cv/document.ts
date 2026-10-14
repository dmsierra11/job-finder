import { cvStyles } from "./cv-styles.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildCvDocument(content: string, title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>${cvStyles}</style>
  </head>
  <body>
    <main>${content}</main>
  </body>
</html>`;
}
