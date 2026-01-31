import prisma from '@/lib/prisma'
import { uploadFile, generateFileKey } from '@/lib/r2'
import { parsePDF, chunkTextByPages, cleanText } from '@/lib/pdf-parser'
import { generateEmbeddings } from '@/lib/embeddings'

export interface ProcessNoteParams {
  userId: string
  subjectId: string
  file: File
  title: string
  description?: string
}

export interface ProcessNoteResult {
  noteId: string
  chunksCreated: number
  fileUrl: string
}

/**
 * Main RAG pipeline: Process uploaded PDF note
 * 1. Upload file to R2
 * 2. Parse PDF and extract text
 * 3. Chunk text into smaller pieces
 * 4. Generate embeddings for each chunk
 * 5. Store chunks and embeddings in database
 */
export async function processNote({
  userId,
  subjectId,
  file,
  title,
  description,
}: ProcessNoteParams): Promise<ProcessNoteResult> {
  // 1. Upload file to R2
  const fileKey = generateFileKey(userId, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { url: fileUrl } = await uploadFile({
    key: fileKey,
    body: buffer,
    contentType: file.type,
    metadata: {
      userId,
      subjectId,
      originalName: file.name,
    },
  })

  // 2. Parse PDF
  const parsed = await parsePDF(buffer)

  // 3. Create note record
  const note = await prisma.note.create({
    data: {
      userId,
      subjectId,
      title,
      description,
      fileUrl,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      pageCount: parsed.totalPages,
    },
  })

  // 4. Chunk text by pages
  const chunks = chunkTextByPages(parsed.pages, 1000, 200)

  // 5. Generate embeddings for all chunks
  const texts = chunks.map((chunk) => cleanText(chunk.content))
  const embeddings = await generateEmbeddings(texts)

  // 6. Store chunks with embeddings in database
  await prisma.$executeRaw`
    INSERT INTO note_chunks (id, note_id, content, page_number, embedding, created_at)
    VALUES ${chunks.map((chunk, index) => {
      const embedding = embeddings[index].embedding
      return prisma.$queryRaw`(
        gen_random_uuid(),
        ${note.id}::uuid,
        ${chunk.content},
        ${chunk.pageNumber || null},
        ${embedding}::vector,
        NOW()
      )`
    })}
  `

  return {
    noteId: note.id,
    chunksCreated: chunks.length,
    fileUrl,
  }
}

export interface SearchChunksParams {
  query: string
  subjectId?: string
  userId: string
  limit?: number
}

export interface SearchResult {
  chunkId: string
  content: string
  pageNumber: number | null
  similarity: number
  note: {
    id: string
    title: string
    fileName: string
  }
}

/**
 * Search for relevant chunks using vector similarity
 */
export async function searchChunks({
  query,
  subjectId,
  userId,
  limit = 5,
}: SearchChunksParams): Promise<SearchResult[]> {
  const { generateEmbedding } = await import('@/lib/embeddings')

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)

  // Search using pgvector cosine similarity
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      nc.id as "chunkId",
      nc.content,
      nc.page_number as "pageNumber",
      1 - (nc.embedding <=> ${queryEmbedding}::vector) as similarity,
      jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'fileName', n.file_name
      ) as note
    FROM note_chunks nc
    INNER JOIN notes n ON nc.note_id = n.id
    WHERE n.user_id = ${userId}::uuid
    ${subjectId ? prisma.$queryRaw`AND n.subject_id = ${subjectId}::uuid` : prisma.$queryRaw``}
    ORDER BY nc.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `

  return results
}

/**
 * Get context for exam generation from user's notes
 */
export async function getExamContext(
  userId: string,
  subjectId: string,
  topics?: string[]
): Promise<string> {
  let query = ''

  if (topics && topics.length > 0) {
    query = topics.join(' ')
  } else {
    // Get all chunks from the subject
    const chunks = await prisma.noteChunk.findMany({
      where: {
        note: {
          userId,
          subjectId,
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return chunks.map((c) => c.content).join('\n\n')
  }

  // Search for relevant chunks
  const results = await searchChunks({
    query,
    userId,
    subjectId,
    limit: 10,
  })

  return results.map((r) => r.content).join('\n\n')
}
