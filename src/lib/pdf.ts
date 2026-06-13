import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;

    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      const content = await page.getTextContent();

      let pageText = "";

      for (const item of content.items as any[]) {
        if (item && typeof item.str === "string") {
          pageText += item.str + " ";
        }
      }

      pages.push(pageText);
    }

    await pdf.destroy();

    const text = pages.join("\n").trim();

    if (text.length < 50) {
      throw new Error(
        "No readable text found. This may be a scanned PDF."
      );
    }

    return text;
  } catch (error) {
    console.error("PDF extraction error:", error);

    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to extract text from PDF."
    );
  }
}