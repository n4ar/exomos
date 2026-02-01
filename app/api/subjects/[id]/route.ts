import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function DELETE(
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

    // Check if subject exists and belongs to user
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            notes: true,
            exams: true,
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    if (subject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if subject has notes or exams
    if (subject._count.notes > 0 || subject._count.exams > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subject with ${subject._count.notes} notes and ${subject._count.exams} exams. Please delete them first.`,
        },
        { status: 400 }
      )
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subject:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete subject' },
      { status: 500 }
    )
  }
}

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

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            notes: true,
            exams: true,
          },
        },
        notes: {
          orderBy: { uploadedAt: 'desc' },
          take: 10,
        },
        exams: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    if (subject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error('Error fetching subject:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch subject' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()
    const { name, description, color } = body

    // Check if subject exists and belongs to user
    const subject = await prisma.subject.findUnique({
      where: { id },
    })

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    if (subject.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
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

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Error updating subject:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subject' },
      { status: 500 }
    )
  }
}
