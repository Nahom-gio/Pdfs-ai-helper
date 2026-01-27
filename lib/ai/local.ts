import "server-only";

type OllamaGenerateResponse = {
  response?: string;
  done?: boolean;
};

type OllamaEmbedResponse = {
  embedding?: number[];
};

function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
}

function getChatModel() {
  return process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b";
}

function getEmbedModel() {
  return process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
}

function normalizeEmbedding(values: number[], targetDim = 1536) {
  if (values.length === targetDim) {
    return values;
  }
  if (values.length > targetDim) {
    return values.slice(0, targetDim);
  }
  return values.concat(new Array(targetDim - values.length).fill(0));
}

export function formatLlmError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "LLM request failed.";
}

export async function generateAnswer(prompt: string) {
  const baseUrl = getOllamaBaseUrl();
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getChatModel(),
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama generate failed: ${response.status}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  return data.response ?? "";
}

export async function embedText(text: string) {
  const baseUrl = getOllamaBaseUrl();
  const response = await fetch(`${baseUrl}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getEmbedModel(),
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.status}`);
  }

  const data = (await response.json()) as OllamaEmbedResponse;
  const embedding = data.embedding;
  if (!embedding) {
    throw new Error("Missing embedding in Ollama response.");
  }
  return normalizeEmbedding(embedding, 1536);
}
