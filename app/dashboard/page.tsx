import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { BentoCard, BentoCardHeader, BentoCardFooter } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { EmptyDataState } from '@/components/EmptyState'
import { MiniScoreCircle } from '@/components/ScoreCircle'
import Link from 'next/link'
import { ensureUserExists } from '@/lib/auth-helpers'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Ensure user exists in Prisma database
  await ensureUserExists(user)

  // Fetch dashboard data
  const [subjects, recentNotes, recentExams, stats] = await Promise.all([
    // Get all subjects with counts
    prisma.subject.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            notes: true,
            exams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    // Get recent notes (through subject relationship)
    prisma.note.findMany({
      where: {
        subject: {
          userId: user.id,
        },
      },
      include: {
        subject: true,
      },
      orderBy: { uploadedAt: 'desc' },
      take: 5,
    }),
    // Get recent exams
    prisma.exam.findMany({
      where: { userId: user.id },
      include: {
        subject: true,
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
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Get stats
    prisma.$transaction([
      prisma.subject.count({ where: { userId: user.id } }),
      prisma.note.count({ where: { subject: { userId: user.id } } }),
      prisma.exam.count({ where: { userId: user.id } }),
    ]),
  ])

  const [totalSubjects, totalNotes, totalExams] = stats

  // Calculate average score from completed exams (based on answers)
  const completedExams = await prisma.exam.findMany({
    where: {
      userId: user.id,
      completedAt: { not: null },
    },
    include: {
      questions: {
        include: {
          answers: {
            where: { userId: user.id },
          },
        },
      },
    },
  })

  const averageScore =
    completedExams.length > 0
      ? Math.round(
          completedExams.reduce((sum, exam) => {
            const totalQuestions = exam.questions.length
            if (totalQuestions === 0) return sum
            const correctAnswers = exam.questions.filter(
              q => q.answers[0]?.isCorrect
            ).length
            return sum + (correctAnswers / totalQuestions) * 100
          }, 0) / completedExams.length
        )
      : 0

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Exomos</h1>
                <p className="text-xs text-muted-foreground">AI Exam Predictor</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/subjects"
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
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
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            ยินดีต้อนรับกลับมา,{' '}
            <span className="gradient-text">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            เริ่มต้นการเรียนรู้ที่มีประสิทธิภาพด้วย AI
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BentoCard
            gradient
            className="animate-scale-in"
            style={{ animationDelay: '0.1s', opacity: 0 } as any}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{totalSubjects}</div>
            <div className="text-sm text-muted-foreground">วิชาทั้งหมด</div>
          </BentoCard>

          <BentoCard
            gradient
            className="animate-scale-in"
            style={{ animationDelay: '0.2s', opacity: 0 } as any}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{totalNotes}</div>
            <div className="text-sm text-muted-foreground">โน้ตที่อัปโหลด</div>
          </BentoCard>

          <BentoCard
            gradient
            className="animate-scale-in"
            style={{ animationDelay: '0.3s', opacity: 0 } as any}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{totalExams}</div>
            <div className="text-sm text-muted-foreground">ข้อสอบที่ทำ</div>
          </BentoCard>

          <BentoCard
            gradient
            className="animate-scale-in"
            style={{ animationDelay: '0.4s', opacity: 0 } as any}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{averageScore}%</div>
            <div className="text-sm text-muted-foreground">คะแนนเฉลี่ย</div>
          </BentoCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Subjects & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subjects Section */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.5s', opacity: 0 } as any}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">วิชาของคุณ</h2>
                <Link
                  href="/subjects"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ดูทั้งหมด →
                </Link>
              </div>

              {subjects.length === 0 ? (
                <EmptyDataState type="subjects" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject, index) => (
                    <BentoCard
                      key={subject.id}
                      hover
                      className="animate-scale-in"
                      style={{ animationDelay: `${0.6 + index * 0.1}s`, opacity: 0 } as any}
                    >
                      <BentoCardHeader
                        icon={
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                          </svg>
                        }
                        title={subject.name}
                        description={subject.description || undefined}
                        badge={
                          <SubjectBadge
                            name={subject.name}
                            color={subject.color || '#6366f1'}
                            size="sm"
                          />
                        }
                      />
                      <BentoCardFooter>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{subject._count.notes} โน้ต</span>
                          <span>{subject._count.exams} ข้อสอบ</span>
                        </div>
                        <Link
                          href={`/subjects/${subject.id}`}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          ดู →
                        </Link>
                      </BentoCardFooter>
                    </BentoCard>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Notes Section */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.8s', opacity: 0 } as any}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">โน้ตล่าสุด</h2>
                <Link
                  href="/notes"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ดูทั้งหมด →
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <EmptyDataState type="notes" />
              ) : (
                <BentoCard>
                  <div className="space-y-3">
                    {recentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{note.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <SubjectBadge
                              name={note.subject.name}
                              color={note.subject.color || '#6366f1'}
                              size="sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.uploadedAt).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </BentoCard>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Recent Exams */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <BentoCard
              gradient
              className="animate-scale-in"
              style={{ animationDelay: '0.9s', opacity: 0 } as any}
            >
              <h3 className="text-lg font-bold mb-4">การกระทำด่วน</h3>
              <div className="space-y-2">
                <Link
                  href="/subjects"
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">📚</span>
                  </div>
                  <span className="font-medium">สร้างวิชา</span>
                </Link>
                <Link
                  href="/notes"
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">📄</span>
                  </div>
                  <span className="font-medium">อัปโหลดโน้ต</span>
                </Link>
                <Link
                  href="/exams/new"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg">🤖</span>
                  </div>
                  <span className="font-medium">สร้างข้อสอบ</span>
                </Link>
              </div>
            </BentoCard>

            {/* Recent Exams */}
            <BentoCard
              className="animate-scale-in"
              style={{ animationDelay: '1s', opacity: 0 } as any}
            >
              <h3 className="text-lg font-bold mb-4">ข้อสอบล่าสุด</h3>
              {recentExams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีข้อสอบ
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExams.map((exam) => {
                    const totalQuestions = exam.questions.length
                    const correctAnswers = exam.questions.filter(
                      q => q.answers[0]?.isCorrect
                    ).length
                    const score = totalQuestions > 0
                      ? Math.round((correctAnswers / totalQuestions) * 100)
                      : 0

                    return (
                      <Link
                        key={exam.id}
                        href={`/exams/${exam.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <MiniScoreCircle
                          score={score}
                          maxScore={100}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam._count.questions} คำถาม
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </BentoCard>

            {/* Motivational Quote */}
            <BentoCard
              className="bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20 animate-scale-in"
              style={{ animationDelay: '1.1s', opacity: 0 } as any}
            >
              <div className="text-4xl mb-4">💡</div>
              <p className="text-sm font-medium mb-2 leading-relaxed">
                "การศึกษาคือการจุดประกายความคิด ไม่ใช่การเติมเต็มภาชนะ"
              </p>
              <p className="text-xs text-muted-foreground">
                — William Butler Yeats
              </p>
            </BentoCard>
          </div>
        </div>
      </main>
    </div>
  )
}
