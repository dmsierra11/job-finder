import { marked } from "marked";

function normalizeSectionHeadings(html: string): string {
  if (/<h2(?:\s|>)/i.test(html)) {
    return html;
  }

  return html.replace(/<(\/?)h3(\s|>)/gi, "<$1h2$2");
}

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, {
    async: false,
    gfm: true,
  });

  return normalizeSectionHeadings(html);
}
