"use client";

import { useActionState } from "react";
import type { UploadState } from "../server/actions/documents";

const initialState: UploadState = {};

type UploadFormProps = {
  action: (prevState: UploadState, formData: FormData) => Promise<UploadState>;
};

export default function UploadForm({ action }: UploadFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className="panel soft stack" action={formAction}>
      <div>
        <div className="section-title">Upload a PDF</div>
        <div className="divider" />
      </div>
      <label className="stack" style={{ gap: 8 }}>
        <span className="muted">Title</span>
        <input className="input" name="title" placeholder="Lecture notes" />
      </label>
      <label className="stack" style={{ gap: 8 }}>
        <span className="muted">PDF file</span>
        <input className="input" type="file" name="file" accept="application/pdf" />
      </label>
      {state?.error ? <p style={{ color: "#8a1f11" }}>{state.error}</p> : null}
      {state?.documentId ? (
        <p style={{ color: "#1f4f3a" }}>
          Uploaded! Document ID: {state.documentId}
        </p>
      ) : null}
      <button className="button full" type="submit">
        Upload & Process
      </button>
    </form>
  );
}
