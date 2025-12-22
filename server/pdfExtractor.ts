// PDF text extraction helper
import { PDFParse } from "pdf-parse";

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  info?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

/**
 * Extract text content from a PDF file given its URL
 * @param pdfUrl - URL of the PDF file (S3 or other public URL)
 * @returns Extracted text content and metadata
 */
export async function extractPdfText(pdfUrl: string): Promise<PdfExtractionResult> {
  try {
    // Fetch the PDF file
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    // Get the PDF as a buffer
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Parse the PDF using PDFParse class
    const parser = new PDFParse({ data });
    
    // Get text content
    const textResult = await parser.getText();
    
    // Get info
    let info: PdfExtractionResult["info"] = {};
    try {
      const infoResult = await parser.getInfo();
      info = {
        title: infoResult.info?.Title,
        author: infoResult.info?.Author,
        subject: infoResult.info?.Subject,
      };
    } catch {
      // Info extraction is optional
    }

    // Clean up
    await parser.destroy();

    return {
      text: textResult.text,
      numPages: textResult.pages.length,
      info,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Extract and format PDF content for inclusion in AI prompts
 * Truncates very long documents to avoid token limits
 * @param pdfUrl - URL of the PDF file
 * @param maxChars - Maximum characters to include (default 30000 ~= 7500 tokens)
 * @returns Formatted string for prompt inclusion
 */
export async function extractPdfForPrompt(pdfUrl: string, maxChars: number = 30000): Promise<string> {
  const result = await extractPdfText(pdfUrl);
  
  let content = result.text.trim();
  
  // Clean up excessive whitespace
  content = content.replace(/\n{3,}/g, "\n\n");
  content = content.replace(/[ \t]+/g, " ");
  
  // Truncate if too long
  let truncated = false;
  if (content.length > maxChars) {
    content = content.slice(0, maxChars);
    // Try to cut at a sentence boundary
    const lastPeriod = content.lastIndexOf(".");
    if (lastPeriod > maxChars * 0.8) {
      content = content.slice(0, lastPeriod + 1);
    }
    truncated = true;
  }
  
  // Format for prompt
  const header = `=== PDF DOCUMENT (${result.numPages} pages${result.info?.title ? `, "${result.info.title}"` : ""}) ===`;
  const footer = truncated ? "\n[Document truncated due to length]" : "";
  
  return `${header}\n\n${content}${footer}\n\n=== END OF PDF DOCUMENT ===`;
}
