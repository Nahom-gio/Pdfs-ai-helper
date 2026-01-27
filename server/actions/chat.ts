"use server";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { embedText, formatLlmError, generateAnswer } from "../../lib/ai/local";

export type ChatState = {
  question?: string;
  answer?: string;
  citations?: number[];
  error?: string;
};

export async function chatWithDocument(
  _prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const question = formData.get("question");
  const docId = formData.get("docId");

  if (typeof question !== "string" || !question.trim()) {
    return { error: "Ask a question about the document." };
  }

  if (typeof docId !== "string" || !docId) {
    return { error: "Missing document id." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in to chat." };
  }

  const embedding = await embedText(question);

  const pageMatch = question.match(/page\s+(\d+)/i);
  const requestedPage = pageMatch ? Number(pageMatch[1]) : null;
  let requestedPageText: string | null = null;

  if (requestedPage && Number.isFinite(requestedPage)) {
    const { data: pageRow } = await supabase
      .from("document_pages")
      .select("text")
      .eq("document_id", docId)
      .eq("page_number", requestedPage)
      .maybeSingle();

    if (pageRow?.text) {
      requestedPageText = pageRow.text;
    }
  }

  const { data: matches, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: 6,
    doc_id: docId,
  });

  if (error) {
    return { error: error.message };
  }

  const contextParts: string[] = [];

  if (requestedPageText) {
    contextParts.push(`Page ${requestedPage} (full text): ${requestedPageText}`);
  }

  contextParts.push(
    ...(matches ?? []).map(
      (match: { page_number: number; content: string }) =>
        `Page ${match.page_number}: ${match.content}`
    )
  );

  const context = contextParts.join("\n\n");

  const prompt = `You are a study assistant. Answer ONLY using the context.\nIf a section is not supported by the context, omit the section entirely (do NOT say \"I don't know\").\nFormat the response like the example: short section headings, bullet points, and a final one-line summary. Use clear, exam-style phrasing.\nCite pages using (p. X) at the end of sentences.\n\nPreferred structure (include only sections supported by context):\n- Title\n- Why do we need it?\n- Main Idea\n- How it works (Step-by-step)\n- Key Point (Exam Line)\n- What is an Interrupt?\n- Interrupt Service Routine (ISR)\n- Important Uses of Interrupts\n- CPU Response to an Interrupt\n- Summary (One-Line)\n\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`;

  let answer = "";
  try {
    answer = await generateAnswer(prompt);
  } catch (error) {
    return { error: formatLlmError(error) };
  }
  const citations = Array.from(
    new Set(
      [
        ...(requestedPage ? [requestedPage] : []),
        ...(matches ?? []).map((match: { page_number: number }) => match.page_number),
      ].filter(Boolean)
    )
  ).sort((a, b) => a - b);

  return {
    question: question.trim(),
    answer,
    citations,
  };
}
