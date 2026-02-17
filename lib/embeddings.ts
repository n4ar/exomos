import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use text-embedding-004 model (768 dimensions)
const embeddingModel = genAI.getGenerativeModel(
  { model: 'text-embedding-004' },
  { apiVersion: 'v1' }
)

export interface EmbeddingResult {
  embedding: number[]
  text: string
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results = await Promise.all(
    texts.map(async (text) => {
      const embedding = await generateEmbedding(text)
      return { embedding, text }
    })
  )

  return results
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
