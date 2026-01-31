import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processNote } from '@/lib/rag-pipeline'

// Configure route segment to allow 100MB uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout for large files

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

    // 4. Process note with RAG pipeline
    const result = await processNote({
      subjectId,
      file,
      title,
      description,
    })

    // 5. Fetch the created note with all required fields
    const prisma = (await import('@/lib/prisma')).default
    const note = await prisma.note.findUnique({
      where: { id: result.noteId },
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

    if (!note) {
      throw new Error('Failed to fetch created note')
    }

    // 6. Map to NotesClient format
    return NextResponse.json({
      id: note.id,
      title: note.title,
      fileName: note.fileName,
      fileUrl: note.fileUrl,
      pageCount: note.pageCount,
      chunkCount: note._count.chunks,
      createdAt: note.uploadedAt,
      subject: note.subject,
    })
  } catch (error) {
    console.error('Error uploading note:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload note' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's notes
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')

    const prisma = (await import('@/lib/prisma')).default

    const notes = await prisma.note.findMany({
      where: {
        subject: {
          userId: user.id,
        },
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: notes,
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}
