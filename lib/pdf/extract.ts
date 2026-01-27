import "server-only";

import { PDFParse } from "pdf-parse";
import path from "path";
import { pathToFileURL } from "url";

export async function extractPdfPages(buffer: Buffer) {
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  PDFParse.setWorker(pathToFileURL(workerPath).toString());

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const pages = result.pages.map((page) => page.text.trim());

  return {
    pageCount: result.total,
    pages,
  };
}
