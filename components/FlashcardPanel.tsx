"use client";

import { useActionState, useMemo, useState } from "react";
import type { FlashcardState } from "../server/actions/flashcards";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  source_page: number | null;
};

type FlashcardPanelProps = {
  docId: string;
  cards: Flashcard[];
  action: (prevState: FlashcardState, formData: FormData) => Promise<FlashcardState>;
  variant?: "panel" | "plain";
};

const initialState: FlashcardState = {};

export default function FlashcardPanel({
  docId,
  cards,
  action,
  variant = "panel",
}: FlashcardPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [quizMode, setQuizMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const currentCard = useMemo(() => {
    if (cards.length === 0) return null;
    return cards[Math.min(currentIndex, cards.length - 1)];
  }, [cards, currentIndex]);

  const handleNext = () => {
    setShowBack(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(cards.length, 1));
  };

  const handlePrev = () => {
    setShowBack(false);
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(cards.length - 1, 0) : prev - 1
    );
  };

  return (
    <div className={variant === "panel" ? "panel stack" : "stack"}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Flashcards</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="button secondary"
            type="button"
            onClick={() => setQuizMode((prev) => !prev)}
          >
            {quizMode ? "Exit quiz" : "Quiz mode"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              const escapeCell = (value: string | number | null) => {
                const cell = String(value ?? "");
                const safe = cell.replace(/\"/g, '\"\"').replace(/\\n/g, " ");
                return `\"${safe}\"`;
              };
              const rows = cards.map((card) =>
                [
                  escapeCell(card.front),
                  escapeCell(card.back),
                  escapeCell(card.source_page ?? ""),
                ].join(",")
              );
              const csv = ["front,back,source_page", ...rows].join("\\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "flashcards.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export CSV
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              const markdown = cards
                .map(
                  (card) =>
                    `### ${card.front}\n\n${card.back}\n\n${
                      card.source_page ? `p. ${card.source_page}` : ""
                    }`
                )
                .join("\n\n---\n\n");
              const blob = new Blob([markdown], {
                type: "text/markdown;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "flashcards.md";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export MD
          </button>
          <form action={formAction}>
            <input type="hidden" name="docId" value={docId} />
            <button className="button secondary" type="submit" disabled={isPending}>
              {isPending ? "Generating..." : "Generate flashcards"}
            </button>
          </form>
        </div>
      </div>
      {state.error ? <p style={{ color: "#8a1f11" }}>{state.error}</p> : null}
      {state.status ? <p style={{ color: "#1f4f3a" }}>{state.status}</p> : null}
      {cards.length > 0 ? (
        quizMode ? (
          <div className="panel stack" style={{ padding: 16 }}>
            <span className="muted">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <strong>{currentCard?.front}</strong>
            {showBack ? (
              <p className="muted">{currentCard?.back}</p>
            ) : (
              <p className="muted">Tap reveal to show the answer.</p>
            )}
            {currentCard?.source_page ? (
              <span className="muted">p. {currentCard.source_page}</span>
            ) : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button secondary" type="button" onClick={handlePrev}>
                Previous
              </button>
              <button className="button" type="button" onClick={() => setShowBack(true)}>
                Reveal answer
              </button>
              <button className="button secondary" type="button" onClick={handleNext}>
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="stack scroll-panel">
            {cards.map((card) => (
              <div key={card.id} className="panel stack" style={{ padding: 16 }}>
                <strong>{card.front}</strong>
                <p className="muted">{card.back}</p>
                {card.source_page ? (
                  <span className="muted">p. {card.source_page}</span>
                ) : null}
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="muted">No flashcards yet.</p>
      )}
    </div>
  );
}
