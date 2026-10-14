import { extractJobsFromAnchors } from "./html.js";
import type { EmailParser } from "./types.js";

export const parseWttjEmail: EmailParser = ({ source, html, text }) => {
  const fromHtml = extractJobsFromAnchors(html, {
    hrefMatches: isWttjJobUrl,
  });
  if (fromHtml.length > 0) {
    return fromHtml.map((job) => ({ ...job, source: source.name }));
  }
  return extractJobsFromAnchors(wrapTextAsHtml(text), {
    hrefMatches: isWttjJobUrl,
  }).map((job) => ({ ...job, source: source.name }));
};

export function isWttjJobUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    return (
      host === "welcometothejungle.com" ||
      host.endsWith(".welcometothejungle.com") ||
      host === "otta.com" ||
      host.endsWith(".otta.com")
    ) && /\/jobs?\//.test(url.pathname);
  } catch {
    return false;
  }
}

function wrapTextAsHtml(text: string): string {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
}
