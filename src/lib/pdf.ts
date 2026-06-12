import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

// Use a CDN worker that matches the installed pdfjs-dist version
GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    const pdf = await getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      useSystemFonts: true,
    }).promise;

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      const textContent = await page.getTextContent();

      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();

      pageTexts.push(text);
    }

    await pdf.destroy();

    return pageTexts.join("\n\n").trim();
  } catch (error) {
    throw new Error(
      `Could not read this PDF. Make sure it contains selectable text and is not a scanned image. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}