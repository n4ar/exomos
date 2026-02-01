import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/r2'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Await params
    const { id } = await params

    // 3. Get note and verify ownership
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    if (note.subject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Extract R2 key from fileUrl
    // fileUrl format: https://{BUCKET_NAME}.r2.dev/{key}
    const urlParts = note.fileUrl.split('.r2.dev/')
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid file URL format' },
        { status: 500 }
      )
    }
    const key = urlParts[1]

    // 5. Generate presigned URL (expires in 1 hour)
    const presignedUrl = await getPresignedUrl(key, 3600)

    return NextResponse.json({ url: presignedUrl })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
