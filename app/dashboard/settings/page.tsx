import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from './ChangePasswordForm'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Toaster } from 'sonner'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
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
                className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
              >
                โน้ต
              </Link>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary font-medium"
              >
                ตั้งค่า
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
            <span className="text-xs font-medium text-accent">ตั้งค่า</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            ตั้งค่า<span className="gradient-text">บัญชี</span>ของคุณ
          </h1>
          <p className="text-lg text-muted-foreground">
            จัดการข้อมูลส่วนตัวและความปลอดภัย
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Navigation (Optional, maybe future use) */}
          <div className="hidden lg:block space-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">เมนูการตั้งค่า</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/dashboard/settings" className="block px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    ความปลอดภัย
                  </Link>
                </li>
                {/* Future settings items can go here */}
              </ul>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Change Password Section */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  เปลี่ยนรหัสผ่าน
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  ตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชี
                </p>
              </div>

              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
