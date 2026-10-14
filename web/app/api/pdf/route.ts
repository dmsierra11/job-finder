import {
  markdownBodyTooLarge,
  parseMarkdownRequest,
  pdfFromMarkdown,
} from "../../../../src/cv/site";
import {
  getSharedBrowser,
  renderPdfBytes,
} from "../../../../src/cv/render-pdf";

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

  try {
    const browser = await getSharedBrowser();
    const { pdf, filename } = await pdfFromMarkdown(
      parsed.markdown,
      (content, title) => renderPdfBytes(content, title, browser),
    );

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The PDF could not be built.";
    const userMessage = message.startsWith("Could not start Chromium")
      ? "Chromium is not installed. Run pnpm exec playwright install chromium and try again."
      : "The PDF could not be built. Try again.";

    return Response.json({ error: userMessage }, { status: 500 });
  }
}
