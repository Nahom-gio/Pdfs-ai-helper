"use client";

import { useActionState } from "react";
import type { SummaryState } from "../server/actions/summaries";

type SummaryPanelProps = {
  docId: string;
  documentSummary?: string | null;
  action: (prevState: SummaryState, formData: FormData) => Promise<SummaryState>;
  variant?: "panel" | "plain";
};

const initialState: SummaryState = {};

export default function SummaryPanel({
  docId,
  documentSummary,
  action,
  variant = "panel",
}: SummaryPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div className={`${variant === "panel" ? "panel" : ""} study-card`}>
      <div className="study-header">
        <div>
          <div className="study-eyebrow">Exam Notes</div>
          <h2>Master Summary</h2>
        </div>
        <form action={formAction}>
          <input type="hidden" name="docId" value={docId} />
          <button className="button secondary" type="submit" disabled={isPending}>
            {isPending ? "Generating..." : "Generate full summary"}
          </button>
        </form>
      </div>
      {state.error ? <p className="study-error">{state.error}</p> : null}
      {state.status ? <p className="study-success">{state.status}</p> : null}
      {documentSummary ? (
        <div className="study-body">{documentSummary}</div>
      ) : (
        <p className="muted">No summary yet. Generate a full exam summary.</p>
      )}
    </div>
  );
}
