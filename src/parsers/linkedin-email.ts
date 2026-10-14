import { extractJobsFromAnchors } from "./html.js";
import type { EmailParser } from "./types.js";

export const parseLinkedInEmail: EmailParser = ({ source, html, text }) => {
  const fromHtml = extractJobsFromAnchors(html, {
    hrefMatches: isLinkedInJobUrl,
  });
  if (fromHtml.length > 0) {
    return fromHtml.map((job) => ({ ...job, source: source.name }));
  }
  return extractJobsFromAnchors(wrapTextAsHtml(text), {
    hrefMatches: isLinkedInJobUrl,
  }).map((job) => ({ ...job, source: source.name }));
};

export function isLinkedInJobUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    return (
      (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") &&
      /\/jobs\/view\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function wrapTextAsHtml(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1">$1</a>',
  );
}
