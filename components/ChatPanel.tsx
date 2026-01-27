"use client";

import { useActionState, useEffect, useState } from "react";
import type { ChatState } from "../server/actions/chat";

type ChatPanelProps = {
  docId: string;
  action: (prevState: ChatState, formData: FormData) => Promise<ChatState>;
  onCitationClick?: (pageNumber: number) => void;
  pageLookup?: (pageNumber: number) => { text: string } | undefined;
};

const initialState: ChatState = {};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: number[];
};

export default function ChatPanel({
  docId,
  action,
  onCitationClick,
}: ChatPanelProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (state.question && state.answer) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: state.question },
        { role: "assistant", content: state.answer, citations: state.citations },
      ]);
    }
  }, [state]);

  return (
    <div className="study-card">
      <div className="study-header">
        <div>
          <div className="study-eyebrow">Ask & Explain</div>
          <h2>Chat with this PDF</h2>
        </div>
      </div>
      <div className="stack study-chat">
        {messages.length === 0 ? (
          <p className="muted">Ask your first question to get started.</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`study-bubble ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="study-role">
                {message.role === "user" ? "You" : "Study Assistant"}
              </div>
              <div className="study-body">{message.content}</div>
              {message.citations && message.citations.length > 0 ? (
                <div className="stack" style={{ gap: 6 }}>
                  <span className="muted">Citations</span>
                  <div className="chip-row">
                    {message.citations.map((page) => (
                      <button
                        key={page}
                        type="button"
                        className="chip"
                        onClick={() => onCitationClick?.(page)}
                      >
                        p. {page}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
      {state.error ? <p className="study-error">{state.error}</p> : null}
      <form className="stack" action={formAction}>
        <input type="hidden" name="docId" value={docId} />
        <label className="stack" style={{ gap: 8 }}>
          <span>Your question</span>
          <input
            className="input"
            name="question"
            placeholder="What is the main thesis of page 3?"
          />
        </label>
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Thinking..." : "Ask"}
        </button>
      </form>
    </div>
  );
}
