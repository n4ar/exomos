import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFile, generateFileKey } from '@/lib/r2'
import prisma from '@/lib/prisma'
import { parsePDF, chunkTextByPages, cleanText } from '@/lib/pdf-parser'
import { generateEmbeddings } from '@/lib/embeddings'

// Configure route segment for large file uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout

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

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const subjectId = formData.get('subjectId') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string | undefined

    // 3. Validate inputs
    if (!file || !subjectId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: file, subjectId, title' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // 4. Verify user owns the subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { userId: true },
    })

    if (!subject || subject.userId !== user.id) {
      return NextResponse.json({ error: 'Subject not found or access denied' }, { status: 403 })
    }

    // 5. Upload file to R2
    const fileKey = generateFileKey(user.id, file.name)
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
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
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
    console.error('Error uploading note:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload note' },
      { status: 500 }
    )
  }
}
