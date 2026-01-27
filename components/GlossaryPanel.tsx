"use client";

import { useActionState } from "react";
import type { GlossaryState } from "../server/actions/glossary";

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  source_page: number | null;
};

type GlossaryPanelProps = {
  docId: string;
  terms: GlossaryTerm[];
  action: (prevState: GlossaryState, formData: FormData) => Promise<GlossaryState>;
  variant?: "panel" | "plain";
};

const initialState: GlossaryState = {};

export default function GlossaryPanel({
  docId,
  terms,
  action,
  variant = "panel",
}: GlossaryPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className={variant === "panel" ? "panel stack" : "stack"}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Glossary</h2>
        <form action={formAction}>
          <input type="hidden" name="docId" value={docId} />
          <button className="button secondary" type="submit" disabled={isPending}>
            {isPending ? "Generating..." : "Generate glossary"}
          </button>
        </form>
      </div>
      {state.error ? <p style={{ color: "#8a1f11" }}>{state.error}</p> : null}
      {state.status ? <p style={{ color: "#1f4f3a" }}>{state.status}</p> : null}
      {terms.length > 0 ? (
        <div className="stack scroll-panel">
          {terms.map((term) => (
            <div key={term.id} className="panel stack" style={{ padding: 16 }}>
              <strong>{term.term}</strong>
              <p className="muted">{term.definition}</p>
              {term.source_page ? (
                <span className="muted">p. {term.source_page}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No glossary terms yet.</p>
      )}
    </div>
  );
}
