import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PDFBatch } from '../types';
import { AppSettings } from '../types';

// Set the workerSrc to load the PDF worker from a CDN.
// This is crucial for running pdf.js in a web environment without bundling the worker file.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

/**
 * Extracts all text content from a given PDF file.
 * @param file - The PDF file to process.
 * @param onProgress - A callback function to report extraction progress (0 to 1).
 * @returns An object containing the extracted text.
 */
export const extractContentFromPDF = async (
  file: File,
  onProgress: (percent: number) => void
): Promise<{ text: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    } catch (error) {
      console.error(`Error processing page ${i}:`, error);
      // Skip failing pages but log the error
      fullText += `--- Page ${i} (Error: Could not extract content) ---\n\n`;
    }
    onProgress(i / totalPages);
  }

  return { text: fullText };
};

/**
 * Splits a long string of text into smaller, manageable batches for AI processing.
 * This implementation uses a simple character-based estimation for token size.
 * @param fullText - The entire text content extracted from the PDF.
 * @param batchSize - The desired size of each batch in "tokens" (estimated).
 * @param overlapSize - The size of the token overlap between consecutive batches.
 * @returns An array of PDFBatch objects.
 */
export const createBatches = (fullText: string, batchSize: number, overlapSize: number): PDFBatch[] => {
  // A common rough estimate: 1 token ~ 4 characters.
  const charsPerToken = 4;
  const batchSizeChars = batchSize * charsPerToken;
  const overlapChars = overlapSize * charsPerToken;

  const batches: PDFBatch[] = [];
  let currentIndex = 0;
  let idCounter = 1;

  while (currentIndex < fullText.length) {
    const end = Math.min(currentIndex + batchSizeChars, fullText.length);
    const textContent = fullText.substring(currentIndex, end);

    batches.push({
      id: idCounter++,
      status: 'pending',
      textContent,
      transformedText: '',
      error: null,
    });

    if (end >= fullText.length) {
      break; // Reached the end of the text
    }

    // Move the current index forward, accounting for the overlap
    currentIndex = Math.max(currentIndex + 1, end - overlapChars);
  }

  return batches;
};

/**
 * Generates a final PDF document from the processed text batches.
 * @param batches - An array of completed PDF batches.
 * @param settings - Application settings for PDF styling.
 * @returns A Blob representing the generated PDF file.
 */
export const generateFinalPDF = (
  batches: PDFBatch[],
  settings: AppSettings
): Blob => {
  const { pdfFontSize, pdfLineHeight, pdfMargin } = settings;

  const doc = new jsPDF({
    unit: 'pt', // Points are standard for typography
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const effectiveWidth = pageWidth - (pdfMargin * 2);

  doc.setFont('times', 'normal');
  doc.setFontSize(pdfFontSize);

  // Combine all transformed text from sorted batches
  const fullReadableText = batches
    .slice() // Create a shallow copy to avoid mutating the original array
    .sort((a, b) => a.id - b.id)
    .map(b => b.transformedText)
    .join('\n\n');

  const lines = doc.splitTextToSize(fullReadableText, effectiveWidth);
  let cursorY = pdfMargin;

  lines.forEach((line: string) => {
    // Check if we need to add a new page
    if (cursorY + (pdfFontSize * pdfLineHeight) > doc.internal.pageSize.getHeight() - pdfMargin) {
      doc.addPage();
      cursorY = pdfMargin;
    }
    doc.text(line, pdfMargin, cursorY);
    cursorY += pdfFontSize * pdfLineHeight;
  });

  return doc.output('blob');
};
