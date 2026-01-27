"use server";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { formatLlmError, generateAnswer } from "../../lib/ai/local";

export type GlossaryState = {
  status?: string;
  error?: string;
};

type GlossaryTerm = {
  term: string;
  definition: string;
  source_page?: number | null;
};

function safeJsonParse(text: string): GlossaryTerm[] {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) {
    candidates.push(arrayMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed as GlossaryTerm[];
      }
    } catch {
      continue;
    }
  }

  return [];
}

export async function generateGlossary(
  _prevState: GlossaryState,
  formData: FormData
): Promise<GlossaryState> {
  const docId = formData.get("docId");

  if (typeof docId !== "string" || !docId) {
    return { error: "Missing document id." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in." };
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("chunks")
    .select("page_number,content")
    .eq("document_id", docId)
    .order("page_number", { ascending: true })
    .limit(16);

  if (chunksError || !chunks || chunks.length === 0) {
    return { error: chunksError?.message ?? "No chunks found." };
  }

  const context = chunks
    .map((chunk) => `Page ${chunk.page_number}: ${chunk.content}`)
    .join("\n\n");

  const prompt = `Create a glossary as a JSON array. Each item: {"term": "...", "definition": "...", "source_page": number}. Use only the context. Return 12-16 terms.\n\nContext:\n${context}\n\nJSON:`;

  let response = "";
  try {
    response = await generateAnswer(prompt);
  } catch (error) {
    return { error: formatLlmError(error) };
  }

  const terms = safeJsonParse(response).filter(
    (term) => term.term && term.definition
  );

  if (terms.length === 0) {
    return { error: "Failed to generate glossary." };
  }

  const payload = terms.map((term) => ({
    document_id: docId,
    term: term.term,
    definition: term.definition,
    source_page: term.source_page ?? null,
  }));

  const { error: insertError } = await supabase
    .from("glossary_terms")
    .insert(payload);

  if (insertError) {
    return { error: insertError.message };
  }

  return { status: "Glossary generated." };
}
