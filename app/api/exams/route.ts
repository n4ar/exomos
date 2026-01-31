import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExam } from '@/lib/exam-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subjectId, title, questionCount, difficulty, topics, questionTypes } = body

    // Validate inputs
    if (!subjectId || !title || !questionCount || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectId, title, questionCount, difficulty' },
        { status: 400 }
      )
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be: easy, medium, or hard' },
        { status: 400 }
      )
    }

    if (questionCount < 1 || questionCount > 50) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 50' },
        { status: 400 }
      )
    }

    // Generate exam
    const result = await generateExam({
      userId: user.id,
      subjectId,
      title,
      questionCount,
      difficulty,
      topics,
      questionTypes,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating exam:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate exam' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const status = searchParams.get('status')

    const prisma = (await import('@/lib/prisma')).default

    const exams = await prisma.exam.findMany({
      where: {
        userId: user.id,
        ...(subjectId && { subjectId }),
        ...(status && { status: status as any }),
      },
      include: {
        subject: {
          select: {
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: exams,
    })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
