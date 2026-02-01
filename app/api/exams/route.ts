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
    const { subjectId, title, multipleChoiceCount, trueFalseCount, difficulty, topics, noteIds } = body

    // Validate inputs
    if (!subjectId || !title || multipleChoiceCount === undefined || trueFalseCount === undefined || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectId, title, multipleChoiceCount, trueFalseCount, difficulty' },
        { status: 400 }
      )
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be: easy, medium, or hard' },
        { status: 400 }
      )
    }

    const totalQuestions = multipleChoiceCount + trueFalseCount

    if (totalQuestions < 1 || totalQuestions > 30) {
      return NextResponse.json(
        { error: 'Total question count must be between 1 and 30' },
        { status: 400 }
      )
    }

    if (multipleChoiceCount < 0 || trueFalseCount < 0) {
      return NextResponse.json(
        { error: 'Question counts cannot be negative' },
        { status: 400 }
      )
    }

    // Generate exam
    const result = await generateExam({
      userId: user.id,
      subjectId,
      title,
      multipleChoiceCount,
      trueFalseCount,
      difficulty,
      topics,
      noteIds,
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
