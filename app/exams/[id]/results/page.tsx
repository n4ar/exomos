import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import ResultsClient from './ResultsClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params

  // Fetch exam with results
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
        include: {
          answers: {
            where: {
              userId: user.id,
            },
            select: {
              id: true,
              questionId: true,
              selectedAnswer: true,
              isCorrect: true,
            },
          },
        },
      },
    },
  })

  if (!exam) {
    redirect('/dashboard')
  }

  if (exam.userId !== user.id) {
    redirect('/dashboard')
  }

  // If not completed, redirect to exam taking page
  if (exam.status !== 'completed') {
    redirect(`/exams/${id}`)
  }

  return <ResultsClient exam={exam} />
}
