import "server-only";

import { createRequire } from "module";

function ensurePdfPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    class DOMMatrix {
      // Minimal stub for pdfjs when no rendering is used.
      constructor() {}
    }
    globalThis.DOMMatrix = DOMMatrix as unknown as typeof globalThis.DOMMatrix;
  }
  if (typeof globalThis.ImageData === "undefined") {
    class ImageData {
      constructor() {
        throw new Error("ImageData is not available in this environment.");
      }
    }
    globalThis.ImageData = ImageData as unknown as typeof globalThis.ImageData;
  }
  if (typeof globalThis.Path2D === "undefined") {
    class Path2D {
      constructor() {}
    }
    globalThis.Path2D = Path2D as unknown as typeof globalThis.Path2D;
  }
}

export async function extractPdfPages(buffer: Buffer) {
  ensurePdfPolyfills();
  const require = createRequire(import.meta.url);
  const { PDFParse } = require("pdf-parse");

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const pages = result.pages.map((page) => page.text.trim());

  return {
    pageCount: result.total,
    pages,
  };
}
