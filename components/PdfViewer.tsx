"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { AskSelectionState } from "../server/actions/selection";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  pdfUrl: string | null;
  page: number;
  docId: string;
  askAction: (prevState: AskSelectionState, formData: FormData) => Promise<AskSelectionState>;
};

const initialState: AskSelectionState = {};

export default function PdfViewer({ pdfUrl, page, docId, askAction }: PdfViewerProps) {
  const [state, formAction, isPending] = useActionState(askAction, initialState);
  const [selectionText, setSelectionText] = useState("");
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedPage, setSelectedPage] = useState(page);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageWidth, setPageWidth] = useState(720);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pageWrapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = Math.max(320, Math.floor(entry.contentRect.width));
      setPageWidth(width);
    });
    observer.observe(pageWrapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (!text || !selection || selection.rangeCount === 0) {
        setSelectionText("");
        setPopupPos(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const anchorNode = selection.anchorNode;
      let pageNumber = currentPage;
      if (anchorNode instanceof Node) {
        const element =
          (anchorNode.nodeType === Node.ELEMENT_NODE
            ? (anchorNode as HTMLElement)
            : anchorNode.parentElement) ?? null;
        const pageEl = element?.closest<HTMLElement>("[data-page-number]");
        const pageAttr = pageEl?.dataset.pageNumber;
        if (pageAttr) {
          const parsed = Number(pageAttr);
          if (Number.isFinite(parsed)) {
            pageNumber = parsed;
          }
        }
      }
      setSelectedPage(pageNumber);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      setSelectionText(text);
      setPopupPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 8,
      });
    };
    document.addEventListener("mouseup", handler);
    return () => document.removeEventListener("mouseup", handler);
  }, []);

  if (!pdfUrl) {
    return (
      <div className="panel stack">
        <h2>PDF Viewer</h2>
        <p className="muted">PDF preview unavailable.</p>
      </div>
    );
  }

  return (
    <div className="panel stack" ref={containerRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>PDF Viewer</h2>
        <span className="muted">Page {page}</span>
      </div>
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Document
          file={pdfUrl}
          loading={<p className="muted">Loading PDF...</p>}
          onLoadSuccess={(info) => setNumPages(info.numPages)}
        >
          <div style={{ padding: 16 }} data-page-number={currentPage} ref={pageWrapRef}>
            <Page
              pageNumber={currentPage}
              width={pageWidth}
              renderTextLayer
              renderAnnotationLayer
            />
          </div>
        </Document>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="button secondary"
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage <= 1}
        >
          ◀ Prev
        </button>
        <span className="muted">
          Page {currentPage} {numPages ? `of ${numPages}` : ""}
        </span>
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            setCurrentPage((prev) => (numPages ? Math.min(prev + 1, numPages) : prev + 1))
          }
          disabled={numPages ? currentPage >= numPages : false}
        >
          Next ▶
        </button>
      </div>
      {selectionText && popupPos ? (
        <div
          className="panel"
          style={{
            position: "absolute",
            left: popupPos.x,
            top: popupPos.y,
            transform: "translate(-50%, -100%)",
            padding: 12,
            minWidth: 240,
            zIndex: 10,
          }}
        >
          <strong>Ask AI about selection</strong>
          <form action={formAction} className="stack" style={{ marginTop: 8 }}>
            <input type="hidden" name="docId" value={docId} />
            <input type="hidden" name="pageNumber" value={selectedPage} />
            <input type="hidden" name="selection" value={selectionText} />
            <button className="button" type="submit" disabled={isPending}>
              {isPending ? "Asking..." : "Ask AI"}
            </button>
          </form>
          {state.error ? <p style={{ color: "#8a1f11" }}>{state.error}</p> : null}
          {state.answer ? (
            <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{state.answer}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
