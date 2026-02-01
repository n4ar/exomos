import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { extractTextWithOCR } from './typhoon-ocr'

export interface ParsedPDF {
  text: string
  pages: Array<{
    pageNumber: number
    text: string
  }>
  totalPages: number
  usedOCR?: boolean
}

/**
 * Parse PDF from buffer and extract text using pdfjs-dist
 * Falls back to OCR if text extraction yields insufficient content
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: undefined,
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages

    const pages: Array<{ pageNumber: number; text: string }> = []
    let fullText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      })

      fullText += pageText + '\n'
    }

    // Check if extracted text is sufficient
    const textContent = fullText.trim()
    const isTextSufficient = textContent.length > 100 // Threshold: at least 100 chars

    if (isTextSufficient) {
      return {
        text: fullText,
        pages,
        totalPages: numPages,
        usedOCR: false,
      }
    }

    // Text extraction yielded insufficient content - likely scanned PDF
    console.log('Insufficient text extracted, falling back to OCR...')

    const ocrResult = await extractTextWithOCR(buffer)

    if (!ocrResult.success) {
      throw new Error('ไม่สามารถอ่านข้อความจาก PDF ได้ กรุณาตรวจสอบว่าไฟล์เป็น PDF ที่ถูกต้อง')
    }

    return {
      text: ocrResult.text,
      pages: ocrResult.pages.map(p => ({
        pageNumber: p.pageNumber,
        text: p.text,
      })),
      totalPages: ocrResult.pages.length,
      usedOCR: true,
    }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('ไม่สามารถประมวลผล PDF ได้: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    .replace(/\x00/g, '') // Remove null bytes (PostgreSQL UTF-8 doesn't support them)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim()
}
