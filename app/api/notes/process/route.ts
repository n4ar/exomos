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
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const { subjectId, title, description, fileKey, fileName, fileSize, fileType, fileUrl } = await request.json()

    // 3. Validate inputs
    if (!subjectId || !title || !fileKey || !fileName) {
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
      return NextResponse.json({ error: 'Subject not found or access denied' }, { status: 403 })
    }

    // 5. Fetch file from R2
    const buffer = await getFile(fileKey)

    // 6. Parse PDF
    const parsed = await parsePDF(buffer)

    // 7. Create note record
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

    // 8. Chunk text by pages
    const chunks = chunkTextByPages(parsed.pages, 1000, 200)

    // 9. Generate embeddings for all chunks
    const texts = chunks.map((chunk) => cleanText(chunk.content))
    const embeddings = await generateEmbeddings(texts)

    // 10. Store chunks with embeddings in database
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
    console.error('Error processing note:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process note' },
      { status: 500 }
    )
  }
}
