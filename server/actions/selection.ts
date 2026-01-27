"use server";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { formatLlmError, generateAnswer } from "../../lib/ai/local";

export type AskSelectionState = {
  answer?: string;
  error?: string;
};

export async function askSelectedText(
  _prevState: AskSelectionState,
  formData: FormData
): Promise<AskSelectionState> {
  const docId = formData.get("docId");
  const selection = formData.get("selection");
  const pageNumber = formData.get("pageNumber");

  if (typeof docId !== "string" || !docId) {
    return { error: "Missing document id." };
  }

  if (typeof selection !== "string" || !selection.trim()) {
    return { error: "No selection provided." };
  }

  const page = Number(pageNumber);
  if (!Number.isFinite(page) || page <= 0) {
    return { error: "Missing page number." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in." };
  }

  const { data: pageRow } = await supabase
    .from("document_pages")
    .select("text")
    .eq("document_id", docId)
    .eq("page_number", page)
    .maybeSingle();

  const context = pageRow?.text ?? "";

  const prompt = `Explain the selected text using the page context. Use clear, exam-style bullets and end with a one-line summary.\n\nSelected text:\n${selection}\n\nPage context:\n${context}\n\nAnswer:`;

  try {
    const answer = await generateAnswer(prompt);
    return { answer: answer.trim() };
  } catch (error) {
    return { error: formatLlmError(error) };
  }
}
