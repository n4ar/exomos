import { PDFParse } from 'pdf-parse'

export interface ParsedPDF {
  text: string
  pages: Array<{
    pageNumber: number
    text: string
  }>
  totalPages: number
}

/**
 * Parse PDF from buffer and extract text
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()

    return {
      text: result.text,
      pages: result.pages.map((page, index) => ({
        pageNumber: index + 1,
        text: page.text,
      })),
      totalPages: result.total,
    }
  } finally {
    await parser.destroy()
  }
}

export interface TextChunk {
  content: string
  pageNumber?: number
  startIndex: number
  endIndex: number
}

/**
 * Split text into chunks with overlap for better context preservation
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const content = text.slice(startIndex, endIndex)

    chunks.push({
      content: content.trim(),
      startIndex,
      endIndex,
    })

    // Move forward by (chunkSize - overlap) to create overlap
    startIndex += chunkSize - overlap
  }

  return chunks
}

/**
 * Split text by pages and then chunk each page
 */
export function chunkTextByPages(
  pages: Array<{ pageNumber: number; text: string }>,
  chunkSize: number = 1000,
  overlap: number = 200
): TextChunk[] {
  const chunks: TextChunk[] = []

  for (const page of pages) {
    const pageChunks = chunkText(page.text, chunkSize, overlap)

    for (const chunk of pageChunks) {
      chunks.push({
        ...chunk,
        pageNumber: page.pageNumber,
      })
    }
  }

  return chunks
}

/**
 * Clean and normalize text for better processing
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim()
}
