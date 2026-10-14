import { extractJobsFromAnchors } from "./html.js";
import type { EmailParser } from "./types.js";

export const parseGlassdoorEmail: EmailParser = ({ source, html, text }) => {
  const fromHtml = extractJobsFromAnchors(html, {
    hrefMatches: isGlassdoorJobUrl,
  });
  if (fromHtml.length > 0) {
    return fromHtml.map((job) => ({ ...job, source: source.name }));
  }
  return extractJobsFromAnchors(wrapTextAsHtml(text), {
    hrefMatches: isGlassdoorJobUrl,
  }).map((job) => ({ ...job, source: source.name }));
};

export function isGlassdoorJobUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    return (
      host === "glassdoor.com" ||
      host.endsWith(".glassdoor.com") ||
      /^glassdoor\.[a-z.]+$/.test(host)
    ) && /job-listing|Job\/|joblisting/i.test(`${url.pathname}${url.search}`);
  } catch {
    return false;
  }
}

function wrapTextAsHtml(text: string): string {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
}
