import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Use the bundled worker as a string URL — works on both desktop and mobile
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    const pdf = await getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      useSystemFonts: true,
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
      `Could not read this PDF. Make sure it is a text-based PDF, not a scanned image. ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}