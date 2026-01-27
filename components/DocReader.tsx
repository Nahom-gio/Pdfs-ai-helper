"use client";

import { useState } from "react";
import ChatPanel from "./ChatPanel";
import FlashcardPanel from "./FlashcardPanel";
import GlossaryPanel from "./GlossaryPanel";
import PdfViewer from "./PdfViewer";
import SummaryPanel from "./SummaryPanel";
import type { ChatState } from "../server/actions/chat";
import type { FlashcardState } from "../server/actions/flashcards";
import type { GlossaryState } from "../server/actions/glossary";
import type { SummaryState } from "../server/actions/summaries";
import type { AskSelectionState } from "../server/actions/selection";

type PageRow = {
  id: string;
  page_number: number;
  text: string;
  summary: string | null;
};

type Flashcard = {
  id: string;
  front: string;
  back: string;
  source_page: number | null;
};

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  source_page: number | null;
};

type DocumentRow = {
  title: string;
  page_count: number;
  created_at: string;
  summary: string | null;
};

type DocReaderProps = {
  docId: string;
  pdfUrl: string | null;
  document: DocumentRow;
  pages: PageRow[];
  flashcards: Flashcard[];
  glossary: GlossaryTerm[];
  chatAction: (prevState: ChatState, formData: FormData) => Promise<ChatState>;
  summaryAction: (prevState: SummaryState, formData: FormData) => Promise<SummaryState>;
  flashcardAction: (prevState: FlashcardState, formData: FormData) => Promise<FlashcardState>;
  glossaryAction: (prevState: GlossaryState, formData: FormData) => Promise<GlossaryState>;
  askSelectionAction: (
    prevState: AskSelectionState,
    formData: FormData
  ) => Promise<AskSelectionState>;
};

export default function DocReader({
  docId,
  pdfUrl,
  document,
  pages,
  flashcards,
  glossary,
  chatAction,
  summaryAction,
  flashcardAction,
  glossaryAction,
  askSelectionAction,
}: DocReaderProps) {
  const [page, setPage] = useState(1);
  const [toolTab, setToolTab] = useState<"summary" | "glossary" | "flashcards" | null>(
    null
  );

  const handleCitationClick = (pageNumber: number) => {
    if (pageNumber > 0) {
      setPage(pageNumber);
    }
  };

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      <div className="panel stack">
        <div className="tab-bar">
          <button
            className={`tab-button ${toolTab === "summary" ? "active" : ""}`}
            type="button"
            onClick={() => setToolTab(toolTab === "summary" ? null : "summary")}
          >
            Summary
          </button>
          <button
            className={`tab-button ${toolTab === "glossary" ? "active" : ""}`}
            type="button"
            onClick={() => setToolTab(toolTab === "glossary" ? null : "glossary")}
          >
            Glossary
          </button>
          <button
            className={`tab-button ${toolTab === "flashcards" ? "active" : ""}`}
            type="button"
            onClick={() => setToolTab(toolTab === "flashcards" ? null : "flashcards")}
          >
            Flashcards
          </button>
        </div>
        {toolTab === "summary" ? (
          <SummaryPanel
            docId={docId}
            documentSummary={document.summary}
            action={summaryAction}
            variant="plain"
          />
        ) : null}
        {toolTab === "glossary" ? (
          <GlossaryPanel
            docId={docId}
            terms={glossary}
            action={glossaryAction}
            variant="plain"
          />
        ) : null}
        {toolTab === "flashcards" ? (
          <FlashcardPanel
            docId={docId}
            cards={flashcards}
            action={flashcardAction}
            variant="plain"
          />
        ) : null}
      </div>
      <PdfViewer
        pdfUrl={pdfUrl}
        page={page}
        docId={docId}
        askAction={askSelectionAction}
      />
      <ChatPanel
        docId={docId}
        action={chatAction}
        onCitationClick={handleCitationClick}
      />
    </div>
  );
}
