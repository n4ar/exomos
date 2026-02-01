import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { SubjectsClient } from './SubjectsClient'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Toaster } from 'sonner'

export default async function SubjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch all subjects with counts
  const subjects = await prisma.subject.findMany({
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
                หน้าหลัก
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
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">วิชา</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            จัดการ<span className="gradient-text">วิชาเรียน</span>ของคุณ
          </h1>
          <p className="text-lg text-muted-foreground">
            จัดการวิชาเรียนและดูภาพรวมของโน้ตและข้อสอบ
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl border border-border bg-card animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">วิชาทั้งหมด</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card animate-scale-in" style={{ animationDelay: '0.2s', opacity: 0 } as any}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subjects.reduce((sum, s) => sum + s._count.notes, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Notes</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card animate-scale-in" style={{ animationDelay: '0.3s', opacity: 0 } as any}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subjects.reduce((sum, s) => sum + s._count.exams, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Exams</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects List */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0 } as any}>
          <SubjectsClient initialSubjects={subjects} />
        </div>
      </main>
    </div>
  )
}
