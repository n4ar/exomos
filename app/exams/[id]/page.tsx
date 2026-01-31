import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ExamTakingClient } from './ExamTakingClient'
import Link from 'next/link'
import { Toaster } from 'sonner'

export default async function ExamTakingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  // Fetch exam with questions
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
    },
  })

  if (!exam) {
    redirect('/dashboard')
  }

  if (exam.userId !== user.id) {
    redirect('/dashboard')
  }

  // If exam is already completed, redirect to results
  if (exam.status === 'completed') {
    redirect(`/exams/${id}/results`)
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Exomos</h1>
                <p className="text-xs text-muted-foreground">AI Exam Predictor</p>
              </div>
            </div>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        <ExamTakingClient exam={exam} />
      </main>
    </div>
  )
}
