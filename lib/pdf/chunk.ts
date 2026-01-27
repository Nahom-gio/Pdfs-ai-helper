export function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  const chunks: string[] = [];
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return chunks;
  }

  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    if (end === cleaned.length) {
      break;
    }
    start = Math.max(end - overlap, 0);
  }

  return chunks;
}