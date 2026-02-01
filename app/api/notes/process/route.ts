import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFile } from '@/lib/r2'
import prisma from '@/lib/prisma'
import { parsePDF, chunkTextByPages, cleanText } from '@/lib/pdf-parser'
import { generateEmbeddings } from '@/lib/embeddings'

// Configure route segment
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout for processing

export async function POST(request: NextRequest) {
  try {
    console.log('[Process] Starting note processing...')

    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[Process] Unauthorized access')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Process] User authenticated:', user.id)

    // 2. Parse request body
    const { subjectId, title, description, fileKey, fileName, fileSize, fileType, fileUrl } = await request.json()

    console.log('[Process] Request data:', { subjectId, title, fileKey, fileName })

    // 3. Validate inputs
    if (!subjectId || !title || !fileKey || !fileName) {
      console.error('[Process] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: subjectId, title, fileKey, fileName' },
        { status: 400 }
      )
    }

    // 4. Verify user owns the subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { userId: true },
    })

    if (!subject || subject.userId !== user.id) {
      console.error('[Process] Subject not found or access denied')
      return NextResponse.json({ error: 'Subject not found or access denied' }, { status: 403 })
    }

    console.log('[Process] Subject verified')

    // 5. Fetch file from R2
    console.log('[Process] Fetching file from R2...')
    const buffer = await getFile(fileKey)
    console.log('[Process] File fetched, size:', buffer.length)

    // 6. Parse PDF
    console.log('[Process] Parsing PDF...')
    const parsed = await parsePDF(buffer)
    console.log('[Process] PDF parsed, pages:', parsed.totalPages)

    // 7. Create note record
    console.log('[Process] Creating note record...')
    const note = await prisma.note.create({
      data: {
        subjectId,
        title,
        description,
        fileUrl,
        fileKey,
        fileName,
        fileType: fileType || 'application/pdf',
        fileSize: fileSize || buffer.length,
        pageCount: parsed.totalPages,
      },
    })
    console.log('[Process] Note created:', note.id)

    // 8. Chunk text by pages
    console.log('[Process] Chunking text...')
    const chunks = chunkTextByPages(parsed.pages, 1000, 200)
    console.log('[Process] Created chunks:', chunks.length)

    // 9. Generate embeddings for all chunks
    console.log('[Process] Generating embeddings...')
    const texts = chunks.map((chunk) => cleanText(chunk.content))
    const embeddings = await generateEmbeddings(texts)
    console.log('[Process] Embeddings generated')

    // 10. Store chunks with embeddings in database
    console.log('[Process] Storing chunks in database...')
    for (const [index, chunk] of chunks.entries()) {
      const embedding = JSON.stringify(embeddings[index].embedding)
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
    console.log('[Process] Chunks stored')

    // 11. Fetch the created note with all required fields
    const createdNote = await prisma.note.findUnique({
      where: { id: note.id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    })

    if (!createdNote) {
      throw new Error('Failed to fetch created note')
    }

    console.log('[Process] Note processing completed successfully')

    // 12. Return note data
    return NextResponse.json({
      id: createdNote.id,
      title: createdNote.title,
      fileName: createdNote.fileName,
      fileUrl: createdNote.fileUrl,
      pageCount: createdNote.pageCount,
      chunkCount: createdNote._count.chunks,
      createdAt: createdNote.uploadedAt,
      subject: createdNote.subject,
    })
  } catch (error) {
    console.error('[Process] Error processing note:', error)
    console.error('[Process] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process note' },
      { status: 500 }
    )
  }
}
