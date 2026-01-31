import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { ensureUserExists } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in Prisma database
    await ensureUserExists(user)

    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const subject = await prisma.subject.create({
      data: {
        userId: user.id,
        name,
        description,
        color: color || '#6366f1',
      },
      include: {
        _count: {
          select: {
            notes: true,
            exams: true,
          },
        },
      },
    })

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error creating subject:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subject' },
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

    // Ensure user exists in Prisma database
    await ensureUserExists(user)

    const subjects = await prisma.subject.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            notes: true,
            exams: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: subjects,
    })
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subjects' },
      { status: 500 }
    )
  }
}
