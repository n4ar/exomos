import prisma from '@/lib/prisma'
import { uploadFile, generateFileKey } from '@/lib/r2'
import { parsePDF, chunkTextByPages, cleanText } from '@/lib/pdf-parser'
import { generateEmbeddings } from '@/lib/embeddings'

export interface ProcessNoteParams {
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
  subjectId,
  file,
  title,
  description,
}: ProcessNoteParams): Promise<ProcessNoteResult> {
  // Get userId from subject
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { userId: true },
  })

  if (!subject) {
    throw new Error('Subject not found')
  }

  // 1. Upload file to R2
  const fileKey = generateFileKey(subject.userId, file.name)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { url: fileUrl } = await uploadFile({
    key: fileKey,
    body: buffer,
    contentType: file.type,
    metadata: {
      subjectId,
      originalName: file.name,
    },
  })

  // 2. Parse PDF
  const parsed = await parsePDF(buffer)

  // 3. Create note record
  const note = await prisma.note.create({
    data: {
      subjectId,
      title,
      description,
      fileUrl,
      fileKey,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      pageCount: parsed.totalPages,
    },
  })

  // 4. Chunk text by pages
  const chunks = chunkTextByPages(parsed.pages, 1000, 200)

  // 5. Generate embeddings for all chunks
  const texts = chunks.map((chunk) => cleanText(chunk.content))
  const embeddings = await generateEmbeddings(texts)

  // 6. Store chunks with embeddings in database using Prisma raw SQL
  // Use $executeRaw with tagged template for SQL injection safety
  // Note: Prisma createMany doesn't support Unsupported types like vector
  for (const [index, chunk] of chunks.entries()) {
    const embedding = JSON.stringify(embeddings[index].embedding)
    // Clean content to remove null bytes and other invalid UTF-8 sequences
    const cleanedContent = chunk.content.replace(/\x00/g, '').trim()

    await prisma.$executeRaw`
      INSERT INTO note_chunks (id, note_id, content, page_number, embedding, created_at)
      VALUES (
        gen_random_uuid(),
        ${note.id}::uuid,
        ${cleanedContent},
        ${chunk.pageNumber},
        ${embedding}::vector,
        NOW()
      )
    `
  }

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
  noteIds?: string[]
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
  noteIds,
}: SearchChunksParams): Promise<SearchResult[]> {
  const { generateEmbedding } = await import('@/lib/embeddings')

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)

  // Convert embedding array to PostgreSQL vector format: [1,2,3]
  const embeddingStr = `[${queryEmbedding.join(',')}]`

  // Build the query conditionally
  const filters = []
  const params: any[] = [embeddingStr, userId]
  let paramIndex = 3

  if (subjectId) {
    filters.push(`AND n.subject_id::text = $${paramIndex}`)
    params.push(subjectId)
    paramIndex++
  }

  if (noteIds && noteIds.length > 0) {
    filters.push(`AND n.id::text = ANY($${paramIndex}::text[])`)
    params.push(noteIds)
    paramIndex++
  }

  params.push(limit)
  const limitParam = `$${paramIndex}`

  // Search using pgvector cosine similarity
  const results = await prisma.$queryRawUnsafe<SearchResult[]>(
    `SELECT
      nc.id as "chunkId",
      nc.content,
      nc.page_number as "pageNumber",
      1 - (nc.embedding <=> $1::vector) as similarity,
      jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'fileName', n.file_name
      ) as note
    FROM note_chunks nc
    INNER JOIN notes n ON nc.note_id = n.id
    INNER JOIN subjects s ON n.subject_id = s.id
    WHERE s.user_id::text = $2
    ${filters.join(' ')}
    ORDER BY nc.embedding <=> $1::vector
    LIMIT ${limitParam}`,
    ...params
  )

  return results
}

/**
 * Get context for exam generation from user's notes
 */
export async function getExamContext(
  userId: string,
  subjectId: string,
  topics?: string[],
  noteIds?: string[]
): Promise<string> {
  let query = ''

  if (topics && topics.length > 0) {
    query = topics.join(' ')
  } else {
    // Get all chunks from the subject (or specific notes if noteIds provided)
    const chunks = await prisma.noteChunk.findMany({
      where: {
        note: {
          subjectId,
          subject: {
            userId,
          },
          ...(noteIds && noteIds.length > 0 ? { id: { in: noteIds } } : {}),
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return chunks.map((c) => c.content).join('\n\n')
  }

  // Search for relevant chunks (with optional note filtering)
  const results = await searchChunks({
    query,
    userId,
    subjectId,
    limit: 10,
    noteIds,
  })

  return results.map((r) => r.content).join('\n\n')
}
