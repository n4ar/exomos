import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ExamGenerationClient } from './ExamGenerationClient'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Toaster } from 'sonner'

export default async function ExamGenerationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch all subjects with note counts
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: {
          notes: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

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
            <Logo href="/dashboard" />

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                Subjects
              </Link>
              <Link
                href="/notes"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                Notes
              </Link>
            </nav>

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-medium text-secondary">Exam Generation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Create Your <span className="gradient-text">AI Exam</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate personalized exam questions from your study notes
          </p>
        </div>

        {/* Generation Form */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.1s', opacity: 0 } as any}
        >
          <ExamGenerationClient subjects={subjects} />
        </div>
      </main>
    </div>
  )
}
