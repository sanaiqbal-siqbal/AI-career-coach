import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromPdf(file: File) {
  const buffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(buffer);
  const pdf = await getDocument({ data: typedArray }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const joined = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(joined);
  }

  return pageTexts.join("\n").trim();
}
