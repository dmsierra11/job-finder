import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const SKIP_LINK_TEXT =
  /unsubscribe|privacy|cookie|view (all|more)|see all|sign in|log in|click here|help center|manage (alert|preference)/i;

export function jobIdFromUrl(url: string): string {
  return createHash("sha256").update(canonicalizeUrl(url)).digest("hex").slice(0, 16);
}

export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.replace(/^www\./, "");
    if (parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function extractJobsFromAnchors(
  html: string,
  options: {
    hrefMatches: (href: string) => boolean;
  },
): { title: string; company: string; location: string; url: string }[] {
  const $ = cheerio.load(html);
  const jobs: { title: string; company: string; location: string; url: string }[] =
    [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = absolutizeHref($(element).attr("href") ?? "");
    if (!href || !options.hrefMatches(href)) {
      return;
    }
    const title = normalizeSpace($(element).text());
    if (!title || SKIP_LINK_TEXT.test(title)) {
      return;
    }
    const canonical = canonicalizeUrl(href);
    if (seen.has(canonical)) {
      return;
    }
    seen.add(canonical);
    const nearby = nearbyLines($, element, title);
    jobs.push({
      title,
      company: nearby.company,
      location: nearby.location,
      url: canonical,
    });
  });

  return jobs;
}

function absolutizeHref(href: string): string {
  if (!href || href.startsWith("mailto:") || href.startsWith("#")) {
    return "";
  }
  try {
    return new URL(href).toString();
  } catch {
    return "";
  }
}

function nearbyLines(
  $: cheerio.CheerioAPI,
  element: AnyNode,
  title: string,
): { company: string; location: string } {
  const container = $(element).closest("td, li, article, tr, div").first();
  const block = (container.length > 0 ? container : $(element).parent()).text();
  const lines = block
    .split(/\n+/)
    .map((line) => normalizeSpace(line))
    .filter((line) => line.length > 0 && line !== title);

  const location =
    lines.find((line) => looksLikeLocation(line) && !looksLikeCompanyOnly(line)) ??
    "";
  const company =
    lines.find(
      (line) =>
        line !== location &&
        !looksLikeLocation(line) &&
        !SKIP_LINK_TEXT.test(line),
    ) ??
    lines.find((line) => line !== location) ??
    "";

  return { company, location };
}

function looksLikeLocation(value: string): boolean {
  return /\b(remote|hybrid|on-?site|spain|barcelona|catalonia|catalunya|europe|united states|germany|france|uk|united kingdom|,)/i.test(
    value,
  );
}

function looksLikeCompanyOnly(value: string): boolean {
  return value.split(/\s+/).length <= 4 && !/,/.test(value) && !/\bremote\b/i.test(value);
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export { normalizeSpace };
