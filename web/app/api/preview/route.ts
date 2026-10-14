import {
  markdownBodyTooLarge,
  parseMarkdownRequest,
  previewFromMarkdown,
} from "../../../../src/cv/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (markdownBodyTooLarge(request.headers.get("content-length"))) {
    return Response.json(
      { error: "Markdown is larger than 200 KB." },
      { status: 413 },
    );
  }

  const parsed = parseMarkdownRequest(await request.text());

  if (!parsed.ok) {
    return Response.json({ error: parsed.message }, { status: parsed.status });
  }

  const preview = previewFromMarkdown(parsed.markdown);

  return Response.json(preview);
}
