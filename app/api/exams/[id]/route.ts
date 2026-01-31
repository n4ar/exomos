import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            name: true,
            color: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        answers: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: exam,
    })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}
