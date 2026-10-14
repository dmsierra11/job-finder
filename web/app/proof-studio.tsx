"use client";

import { useEffect, useId, useRef, useState } from "react";

type PreviewPayload = {
  html?: string;
  error?: string;
};

type CvDocPayload = {
  markdown?: string;
  error?: string;
};

export type SavedCv = {
  id: string;
  label: string;
};

export function ProofStudio({ documents }: { documents: SavedCv[] }) {
  const editorId = useId();
  const libraryId = useId();
  const [markdown, setMarkdown] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const previewGeneration = useRef(0);
  const docGeneration = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canDownload = markdown.trim().length > 0 && !downloading;

  useEffect(() => {
    const stage = stageRef.current;
    const iframe = iframeRef.current;

    if (!stage || !iframe) {
      return;
    }

    const updateScale = () => {
      const iframeWidth = iframe.offsetWidth;
      const iframeHeight = iframe.offsetHeight;

      if (iframeWidth === 0 || iframeHeight === 0) {
        return;
      }

      const scale = Math.min(
        stage.clientWidth / iframeWidth,
        stage.clientHeight / iframeHeight,
      );
      stage.style.setProperty("--preview-scale", String(scale));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    observer.observe(iframe);
    updateScale();

    return () => observer.disconnect();
  }, [html]);

  useEffect(() => {
    if (markdown.trim().length === 0) {
      previewGeneration.current += 1;
      setHtml(null);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const generation = previewGeneration.current + 1;
      previewGeneration.current = generation;

      void (async () => {
        try {
          const response = await fetch("/api/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markdown }),
          });
          const payload = (await response.json()) as PreviewPayload;

          if (generation !== previewGeneration.current) {
            return;
          }

          if (!response.ok || payload.html === undefined) {
            setError(payload.error ?? "Preview could not be built. Check the markdown and try again.");
            return;
          }

          setError(null);
          setHtml(payload.html);
        } catch {
          if (generation !== previewGeneration.current) {
            return;
          }

          setError("The preview request did not complete. Try again.");
        }
      })();
    }, 280);

    return () => window.clearTimeout(timer);
  }, [markdown]);

  async function chooseDocument(id: string) {
    const generation = docGeneration.current + 1;
    docGeneration.current = generation;
    setSelectedId(id);

    if (id.length === 0) {
      setLoadingDoc(false);
      return;
    }

    setLoadingDoc(true);
    setError(null);

    try {
      const response = await fetch(`/api/cv-docs/${encodeURIComponent(id)}`);
      const payload = (await response.json()) as CvDocPayload;

      if (generation !== docGeneration.current) {
        return;
      }

      if (!response.ok || typeof payload.markdown !== "string") {
        setError(payload.error ?? "That CV is not in the saved list.");
        return;
      }

      setMarkdown(payload.markdown);
    } catch {
      if (generation !== docGeneration.current) {
        return;
      }

      setError("The saved CV could not be loaded. Try again.");
    } finally {
      if (generation === docGeneration.current) {
        setLoadingDoc(false);
      }
    }
  }

  async function downloadPdf() {
    if (!canDownload) {
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "The PDF could not be built. Check the markdown and try again.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        /filename="([^"]+)"/.exec(disposition ?? "")?.[1] ?? "cv.pdf";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The PDF request did not complete. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="studio">
      <header className="masthead">
        <div className="masthead-copy">
          <p className="kicker">A4 proof</p>
          <h1>CV proof</h1>
        </div>
        <div className="masthead-actions">
          {error ? <p className="error">{error}</p> : null}
          <button
            type="button"
            className="download"
            disabled={!canDownload}
            onClick={() => {
              void downloadPdf();
            }}
          >
            {downloading ? "Building PDF" : "Download PDF"}
          </button>
        </div>
      </header>

      <div className="board">
        <section
          className={documents.length > 0 ? "manuscript has-library" : "manuscript"}
          aria-labelledby={editorId}
        >
          {documents.length > 0 ? (
            <div className="field">
              <div className="field-heading">
                <label htmlFor={libraryId}>Saved CV</label>
                {loadingDoc ? <span className="field-status">Loading</span> : null}
              </div>
              <select
                id={libraryId}
                value={selectedId}
                disabled={loadingDoc}
                onChange={(event) => {
                  void chooseDocument(event.target.value);
                }}
              >
                <option value="">Choose a file</option>
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field editor-field">
            <label htmlFor={editorId}>Markdown</label>
            <textarea
              id={editorId}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              spellCheck={false}
              placeholder="# Your name"
            />
          </div>
        </section>

        <section className="press" aria-label="Printed page">
          <div className="sheet-stage" ref={stageRef}>
            <div className="crop tl" aria-hidden="true" />
            <div className="crop tr" aria-hidden="true" />
            <div className="crop bl" aria-hidden="true" />
            <div className="crop br" aria-hidden="true" />
            <div className="sheet">
              {html ? (
                <iframe
                  ref={iframeRef}
                  title="CV page"
                  sandbox=""
                  srcDoc={html}
                />
              ) : (
                <p className="empty">
                  {documents.length > 0
                    ? "Choose a saved CV or paste markdown to see the page."
                    : "Paste a CV to see the page."}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
