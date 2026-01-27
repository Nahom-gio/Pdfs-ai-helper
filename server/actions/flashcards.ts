"use server";

import { createServerSupabaseClient } from "../../lib/supabase/server";
import { formatLlmError, generateAnswer } from "../../lib/ai/local";

export type FlashcardState = {
  status?: string;
  error?: string;
};

type Flashcard = {
  front: string;
  back: string;
  source_page?: number | null;
};

function safeJsonParse(text: string): Flashcard[] {
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
        return parsed as Flashcard[];
      }
    } catch {
      continue;
    }
  }

  return [];
}

export async function generateFlashcards(
  _prevState: FlashcardState,
  formData: FormData
): Promise<FlashcardState> {
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
    .limit(12);

  if (chunksError || !chunks || chunks.length === 0) {
    return { error: chunksError?.message ?? "No chunks found." };
  }

  const context = chunks
    .map((chunk) => `Page ${chunk.page_number}: ${chunk.content}`)
    .join("\n\n");

  const prompt = `Create 8 flashcards as JSON array. Each item: {"front": "...", "back": "...", "source_page": number}. Use only the context.\n\nContext:\n${context}\n\nJSON:`;

  let response = "";
  try {
    response = await generateAnswer(prompt);
  } catch (error) {
    return { error: formatLlmError(error) };
  }
  const cards = safeJsonParse(response).filter(
    (card) => card.front && card.back
  );

  if (cards.length === 0) {
    return { error: "Failed to generate flashcards." };
  }

  const payload = cards.map((card) => ({
    document_id: docId,
    front: card.front,
    back: card.back,
    source_page: card.source_page ?? null,
  }));

  const { error: insertError } = await supabase
    .from("flashcards")
    .insert(payload);

  if (insertError) {
    return { error: insertError.message };
  }

  return { status: "Flashcards generated." };
}
