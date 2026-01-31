import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BentoCard, BentoCardHeader, BentoCardFooter } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { EmptyDataState } from '@/components/EmptyState'
import { MiniScoreCircle } from '@/components/ScoreCircle'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface SubjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  // Fetch subject with notes and exams
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
        include: {
          _count: {
            select: {
              chunks: true,
            },
          },
        },
      },
      exams: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
          questions: {
            include: {
              answers: {
                where: { userId: user.id },
              },
            },
          },
        },
      },
    },
  })

  if (!subject) {
    notFound()
  }

  if (subject.userId !== user.id) {
    redirect('/subjects')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
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

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary font-medium"
              >
                วิชา
              </Link>
              <Link
                href="/notes"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                โน้ต
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
          href="/subjects"
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
          กลับไปหน้าวิชา
        </Link>

        {/* Subject Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold">{subject.name}</h1>
                <SubjectBadge
                  name={subject.name}
                  color={subject.color || '#6366f1'}
                  size="md"
                />
              </div>
              {subject.description && (
                <p className="text-lg text-muted-foreground">{subject.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <BentoCard
            className="animate-scale-in"
            style={{ animationDelay: '0.1s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">{subject._count.notes}</p>
                <p className="text-sm text-muted-foreground">โน้ต</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard
            className="animate-scale-in"
            style={{ animationDelay: '0.2s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">{subject._count.exams}</p>
                <p className="text-sm text-muted-foreground">ข้อสอบ</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard
            className="animate-scale-in"
            style={{ animationDelay: '0.3s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {subject.notes.reduce((sum, note) => sum + note._count.chunks, 0)}
                </p>
                <p className="text-sm text-muted-foreground">ส่วนข้อมูล</p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/notes">
            <BentoCard
              hover
              className="animate-scale-in cursor-pointer"
              style={{ animationDelay: '0.4s', opacity: 0 } as any}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold mb-1">อัปโหลดโน้ต</p>
                  <p className="text-sm text-muted-foreground">
                    เพิ่มโน้ต PDF ใหม่ในวิชานี้
                  </p>
                </div>
              </div>
            </BentoCard>
          </Link>

          <Link href="/exams/new">
            <BentoCard
              hover
              className="animate-scale-in cursor-pointer"
              style={{ animationDelay: '0.5s', opacity: 0 } as any}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold mb-1">สร้างข้อสอบ</p>
                  <p className="text-sm text-muted-foreground">
                    สร้างข้อสอบด้วย AI จากโน้ต
                  </p>
                </div>
              </div>
            </BentoCard>
          </Link>
        </div>

        {/* Notes Section */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s', opacity: 0 } as any}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Notes</h2>
            <Link href="/notes" className="text-sm text-primary hover:underline font-medium">
              View All →
            </Link>
          </div>

          {subject.notes.length === 0 ? (
            <EmptyDataState type="notes" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.notes.map((note) => (
                <BentoCard key={note.id} hover>
                  <BentoCardHeader
                    icon={
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    }
                    title={note.title}
                  />
                  <div className="my-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pages</span>
                      <span className="font-semibold">{note.pageCount || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chunks</span>
                      <span className="font-semibold">{note._count.chunks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span className="font-semibold">
                        {new Date(note.uploadedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                  <BentoCardFooter>
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View PDF →
                    </a>
                  </BentoCardFooter>
                </BentoCard>
              ))}
            </div>
          )}
        </div>

        {/* Exams Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.7s', opacity: 0 } as any}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Exams</h2>
          </div>

          {subject.exams.length === 0 ? (
            <EmptyDataState type="exams" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subject.exams.map((exam) => {
                const totalQuestions = exam.questions.length
                const correctAnswers = exam.questions.filter(
                  (q) => q.answers[0]?.isCorrect
                ).length
                const score =
                  totalQuestions > 0
                    ? Math.round((correctAnswers / totalQuestions) * 100)
                    : 0

                return (
                  <Link key={exam.id} href={`/exams/${exam.id}`}>
                    <BentoCard hover className="cursor-pointer">
                      <div className="flex items-start gap-4">
                        <MiniScoreCircle score={score} maxScore={100} size={48} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{exam.title}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {exam._count.questions} questions
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exam.difficulty} • {exam.completedAt ? 'Completed' : 'In Progress'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </BentoCard>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
