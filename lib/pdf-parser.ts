import { PDFParse } from 'pdf-parse'
import { extractTextWithOCR } from './typhoon-ocr'

// Polyfill canvas for pdf-parse on serverless
if (typeof window === 'undefined') {
  try {
    const { Canvas, Image, ImageData, Path2D, DOMMatrix } = require('canvas')
    ;(global as any).Canvas = Canvas
    ;(global as any).Image = Image
    ;(global as any).ImageData = ImageData
    ;(global as any).Path2D = Path2D
    ;(global as any).DOMMatrix = DOMMatrix
  } catch (e) {
    console.warn('Canvas polyfill not available:', e)
  }
}

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
 * Parse PDF from buffer and extract text
 * Falls back to OCR if text extraction yields insufficient content
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedPDF> {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()

    // Check if extracted text is sufficient
    const textContent = result.text.trim()
    const isTextSufficient = textContent.length > 100 // Threshold: at least 100 chars

    if (isTextSufficient) {
      // Regular text-based PDF
      return {
        text: result.text,
        pages: result.pages.map((page, index) => ({
          pageNumber: index + 1,
          text: page.text,
        })),
        totalPages: result.total,
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
    throw new Error('ไม่สามารถประมวลผล PDF ได้')
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
    .replace(/\x00/g, '') // Remove null bytes (PostgreSQL UTF-8 doesn't support them)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim()
}
