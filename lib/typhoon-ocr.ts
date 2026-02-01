export interface TyphoonOCRConfig {
  apiKey: string
  model?: string
  taskType?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  repetitionPenalty?: number
}

export interface TyphoonOCRResult {
  success: boolean
  text: string
  pages: Array<{
    pageNumber: number
    text: string
    success: boolean
    error?: string
  }>
}

/**
 * Extract text from scanned PDF using Typhoon OCR API
 */
export async function extractTextWithOCR(
  pdfBuffer: Buffer,
  config?: Partial<TyphoonOCRConfig>
): Promise<TyphoonOCRResult> {
  const apiKey = config?.apiKey || process.env.TYPHOON_OCR_API_KEY

  if (!apiKey) {
    throw new Error('Typhoon OCR API key not configured')
  }

  const formData = new FormData()
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })

  formData.append('file', blob, 'document.pdf')
  formData.append('model', config?.model || 'typhoon-ocr')
  formData.append('task_type', config?.taskType || 'default')
  formData.append('max_tokens', (config?.maxTokens || 16384).toString())
  formData.append('temperature', (config?.temperature || 0.1).toString())
  formData.append('top_p', (config?.topP || 0.6).toString())
  formData.append('repetition_penalty', (config?.repetitionPenalty || 1.2).toString())

  const response = await fetch('https://api.opentyphoon.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Typhoon OCR API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Parse results by page
  const pages: TyphoonOCRResult['pages'] = []
  let allText = ''

  for (const pageResult of result.results || []) {
    if (pageResult.success && pageResult.message) {
      let content = pageResult.message.choices[0].message.content

      try {
        // Try to parse as JSON if it's structured output
        const parsedContent = JSON.parse(content)
        content = parsedContent.natural_text || content
      } catch {
        // Use content as-is if not JSON
      }

      const pageNumber = pages.length + 1
      pages.push({
        pageNumber,
        text: content,
        success: true,
      })
      allText += content + '\n'
    } else {
      pages.push({
        pageNumber: pages.length + 1,
        text: '',
        success: false,
        error: pageResult.error || 'Unknown error',
      })
    }
  }

  return {
    success: pages.some(p => p.success),
    text: allText.trim(),
    pages,
  }
}
