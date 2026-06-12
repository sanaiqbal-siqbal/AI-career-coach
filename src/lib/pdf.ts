import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Let Vite serve the worker
GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    const pdf = await getDocument({
      data: new Uint8Array(buffer),
    }).promise;

    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      const textContent = await page.getTextContent();

      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pages.push(text);
    }

    await pdf.destroy();

    return pages.join("\n\n").trim();
  } catch (error) {
    throw new Error(
      `Could not read this PDF. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}