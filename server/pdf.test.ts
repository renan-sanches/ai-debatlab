import { describe, it, expect } from "vitest";
import type { LLMMessage, MessageContent, TextContent, FileContent, ImageContent } from "./llmHelper";
import { buildStandardParticipantPrompt, buildDevilsAdvocatePrompt, buildModeratorPrompt } from "./prompts";

// Test the multimodal message building logic
describe("PDF Multimodal Content", () => {
  it("should build text-only message when no PDF or image", () => {
    const prompt = "Test question about AI";
    const pdfUrl: string | undefined = undefined;
    const imageUrl: string | undefined = undefined;

    // Build message content like streamingRoutes.ts does
    const messageContent: MessageContent[] = [
      { type: "text", text: prompt }
    ];

    if (imageUrl) {
      messageContent.push({
        type: "image_url",
        image_url: { url: imageUrl, detail: "auto" }
      });
    }

    if (pdfUrl) {
      messageContent.push({
        type: "file_url",
        file_url: { url: pdfUrl, mime_type: "application/pdf" }
      });
    }

    // When only text, should use simple string content
    const messages: LLMMessage[] = [{
      role: "user",
      content: messageContent.length === 1 ? prompt : messageContent
    }];

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe(prompt);
  });

  it("should build multimodal message when PDF is provided", () => {
    const prompt = "Analyze this report";
    const pdfUrl = "https://example.com/report.pdf";
    const imageUrl: string | undefined = undefined;

    const messageContent: MessageContent[] = [
      { type: "text", text: prompt }
    ];

    if (imageUrl) {
      messageContent.push({
        type: "image_url",
        image_url: { url: imageUrl, detail: "auto" }
      });
    }

    if (pdfUrl) {
      messageContent.push({
        type: "file_url",
        file_url: { url: pdfUrl, mime_type: "application/pdf" }
      });
    }

    const messages: LLMMessage[] = [{
      role: "user",
      content: messageContent.length === 1 ? prompt : messageContent
    }];

    expect(messages).toHaveLength(1);
    expect(Array.isArray(messages[0].content)).toBe(true);
    
    const content = messages[0].content as MessageContent[];
    expect(content).toHaveLength(2);
    
    const textPart = content[0] as TextContent;
    expect(textPart.type).toBe("text");
    expect(textPart.text).toBe(prompt);
    
    const filePart = content[1] as FileContent;
    expect(filePart.type).toBe("file_url");
    expect(filePart.file_url.url).toBe(pdfUrl);
    expect(filePart.file_url.mime_type).toBe("application/pdf");
  });

  it("should build multimodal message with both image and PDF", () => {
    const prompt = "Analyze this data";
    const pdfUrl = "https://example.com/report.pdf";
    const imageUrl = "https://example.com/chart.png";

    const messageContent: MessageContent[] = [
      { type: "text", text: prompt }
    ];

    if (imageUrl) {
      messageContent.push({
        type: "image_url",
        image_url: { url: imageUrl, detail: "auto" }
      });
    }

    if (pdfUrl) {
      messageContent.push({
        type: "file_url",
        file_url: { url: pdfUrl, mime_type: "application/pdf" }
      });
    }

    const messages: LLMMessage[] = [{
      role: "user",
      content: messageContent.length === 1 ? prompt : messageContent
    }];

    expect(messages).toHaveLength(1);
    expect(Array.isArray(messages[0].content)).toBe(true);
    
    const content = messages[0].content as MessageContent[];
    expect(content).toHaveLength(3);
    
    const textPart = content[0] as TextContent;
    expect(textPart.type).toBe("text");
    
    const imagePart = content[1] as ImageContent;
    expect(imagePart.type).toBe("image_url");
    expect(imagePart.image_url.url).toBe(imageUrl);
    
    const filePart = content[2] as FileContent;
    expect(filePart.type).toBe("file_url");
    expect(filePart.file_url.url).toBe(pdfUrl);
  });
});

// Test prompt context includes PDF content (extracted text)
describe("Prompt Context with PDF Content", () => {
  it("should include PDF content in standard prompt", () => {
    const ctx = {
      userQuestion: "What does this report say?",
      previousResponses: "",
      roundNumber: 1,
      modelName: "Claude Sonnet 4.5",
      modelLens: "Balanced reasoning",
      pdfUrl: "https://example.com/report.pdf",
      pdfContent: "=== PDF DOCUMENT (5 pages) ===\n\nThis is the quarterly report content...\n\n=== END OF PDF DOCUMENT ===",
    };

    const prompt = buildStandardParticipantPrompt(ctx);
    
    expect(prompt).toContain("What does this report say?");
    expect(prompt).toContain("ATTACHED PDF DOCUMENT CONTENT");
    expect(prompt).toContain("quarterly report content");
  });

  it("should include PDF content in devil's advocate prompt", () => {
    const ctx = {
      userQuestion: "Is this report accurate?",
      previousResponses: "",
      roundNumber: 1,
      modelName: "GPT-5.2",
      modelLens: "Broad knowledge",
      pdfUrl: "https://example.com/report.pdf",
      pdfContent: "=== PDF DOCUMENT (3 pages) ===\n\nFinancial data here...\n\n=== END OF PDF DOCUMENT ===",
    };

    const prompt = buildDevilsAdvocatePrompt(ctx);
    
    expect(prompt).toContain("Is this report accurate?");
    expect(prompt).toContain("ATTACHED PDF DOCUMENT CONTENT");
    expect(prompt).toContain("Financial data here");
  });

  it("should include PDF content in moderator prompt", () => {
    const ctx = {
      userQuestion: "Analyze this quarterly report",
      previousResponses: "",
      roundNumber: 1,
      modelName: "Gemini 3 Pro",
      modelLens: "Technical depth",
      allParticipantResponses: "Model A said X. Model B said Y.",
      pdfUrl: "https://example.com/report.pdf",
      pdfContent: "=== PDF DOCUMENT (10 pages) ===\n\nDetailed analysis...\n\n=== END OF PDF DOCUMENT ===",
    };

    const prompt = buildModeratorPrompt(ctx);
    
    expect(prompt).toContain("Analyze this quarterly report");
    expect(prompt).toContain("ATTACHED PDF DOCUMENT CONTENT");
    expect(prompt).toContain("Detailed analysis");
  });

  it("should not include PDF content when pdfContent is undefined", () => {
    const ctx = {
      userQuestion: "What is the meaning of life?",
      previousResponses: "",
      roundNumber: 1,
      modelName: "Claude Sonnet 4.5",
      modelLens: "Balanced reasoning",
      pdfUrl: undefined,
      pdfContent: undefined,
    };

    const prompt = buildStandardParticipantPrompt(ctx);
    
    expect(prompt).toContain("What is the meaning of life?");
    expect(prompt).not.toContain("ATTACHED PDF DOCUMENT CONTENT");
  });
});
