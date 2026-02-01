import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { NotesClient } from './NotesClient'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Toaster } from 'sonner'

// Enable static generation with revalidation
export const dynamic = 'force-dynamic' // Always fetch fresh data

export default async function NotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch all notes and subjects
  const [notesFromDb, subjects] = await Promise.all([
    prisma.note.findMany({
      where: {
        subject: {
          userId: user.id,
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // Map database format to NotesClient format
  const notes = notesFromDb.map((note) => ({
    id: note.id,
    title: note.title,
    fileName: note.fileName,
    fileUrl: note.fileUrl,
    pageCount: note.pageCount,
    chunkCount: note._count.chunks,
    createdAt: note.uploadedAt,
    subject: note.subject,
  }))

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
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                วิชา
              </Link>
              <Link
                href="/notes"
                className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary font-medium"
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-accent">โน้ต</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="gradient-text">โน้ตเรียน</span>ของคุณ
          </h1>
          <p className="text-lg text-muted-foreground">
            อัปโหลดและจัดการโน้ตเรียนของคุณ
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className="p-6 rounded-2xl border border-border bg-card animate-scale-in"
            style={{ animationDelay: '0.1s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{notes.length}</p>
                <p className="text-sm text-muted-foreground">โน้ตทั้งหมด</p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-2xl border border-border bg-card animate-scale-in"
            style={{ animationDelay: '0.2s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">วิชา</p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-2xl border border-border bg-card animate-scale-in"
            style={{ animationDelay: '0.3s', opacity: 0 } as any}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notes.reduce((sum, note) => sum + note.chunkCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Chunks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.4s', opacity: 0 } as any}
        >
          <NotesClient initialNotes={notes} subjects={subjects} />
        </div>
      </main>
    </div>
  )
}
