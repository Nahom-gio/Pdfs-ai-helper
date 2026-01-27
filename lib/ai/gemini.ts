import "server-only";

import { GoogleGenAI } from "@google/genai";

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY) env var.");
  }
  return apiKey;
}

export function createGeminiClient() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() });
}

export async function embedText(text: string) {
  const ai = createGeminiClient();
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: { outputDimensionality: 1536 },
  });

  const embedding = result.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Failed to generate embedding.");
  }
  return embedding;
}

export async function generateAnswer(prompt: string) {
  const ai = createGeminiClient();
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return result.text ?? "";
}

export function formatGeminiError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Gemini request failed.";
  }

  const message = error.message ?? "Gemini request failed.";
  if (message.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      const apiMessage = parsed?.error?.message;
      const retryDelay = parsed?.error?.details?.find(
        (detail: { ["@type"]?: string }) =>
          detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      )?.retryDelay;

      if (apiMessage && retryDelay) {
        return `${apiMessage} Retry after ${retryDelay}.`;
      }
      if (apiMessage) {
        return apiMessage;
      }
    } catch {
      return message;
    }
  }

  return message;
}
