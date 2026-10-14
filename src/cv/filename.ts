export function cvTitleFromMarkdown(markdown: string): string {
  const heading = firstHeading(markdown);

  return heading ?? "CV";
}

export function cvFilenameFromMarkdown(markdown: string): string {
  const heading = firstHeading(markdown);

  if (heading === undefined) {
    return "cv.pdf";
  }

  const slug = heading.replaceAll(/\s+/g, "-").replaceAll(/[^\w.-]+/g, "");

  return slug.length > 0 ? `${slug}.pdf` : "cv.pdf";
}

function firstHeading(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+?)\s*$/m);
  const heading = match?.[1]?.trim();

  return heading && heading.length > 0 ? heading : undefined;
}
