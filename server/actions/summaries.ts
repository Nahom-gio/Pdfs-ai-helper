"use server";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { formatLlmError, generateAnswer } from "../../lib/ai/local";

export type SummaryState = {
  status?: string;
  error?: string;
};

export async function generateSummaries(
  _prevState: SummaryState,
  formData: FormData
): Promise<SummaryState> {
  const docId = formData.get("docId");

  if (typeof docId !== "string" || !docId) {
    return { error: "Missing document id." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in." };
  }

  const { data: pages, error: pagesError } = await supabase
    .from("document_pages")
    .select("id,page_number,text,summary")
    .eq("document_id", docId)
    .order("page_number", { ascending: true });

  if (pagesError || !pages) {
    return { error: pagesError?.message ?? "Failed to load pages." };
  }

  const contextParts = pages.map((page) => {
    const summaryOrText =
      page.summary && page.summary.trim().length > 0
        ? page.summary
        : page.text.slice(0, 1200);
    return `Page ${page.page_number}: ${summaryOrText}`;
  });

  const docPrompt = `Create an exam-focused full-document summary in about 1-2 pages.\nUse clear headings and bullet points.\nInclude: main idea, key definitions, important processes/steps, and likely exam points.\nUse only the context below.\n\nContext:\n${contextParts.join(
    "\n\n"
  )}\n\nSummary:`;

  let docSummary = "";
  try {
    docSummary = await generateAnswer(docPrompt);
  } catch (error) {
    return { error: formatLlmError(error) };
  }

  if (docSummary.trim()) {
    const { error: docError } = await supabase
      .from("documents")
      .update({ summary: docSummary.trim() })
      .eq("id", docId);

    if (docError) {
      return { error: docError.message };
    }
  }

  revalidatePath(`/docs/${docId}`);

  return { status: "Full document summary generated." };
}
