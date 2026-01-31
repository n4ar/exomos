import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
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
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            เริ่มต้นการเรียนรู้ที่มีประสิทธิภาพด้วย AI
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Stats Cards */}
          <div className="bento-card bento-card-gradient animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">+0%</span>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-muted-foreground">วิชาทั้งหมด</div>
          </div>

          <div className="bento-card bento-card-gradient animate-scale-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">+0%</span>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-muted-foreground">โน้ตที่อัปโหลด</div>
          </div>

          <div className="bento-card bento-card-gradient animate-scale-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary font-medium">+0%</span>
            </div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-muted-foreground">ข้อสอบที่ทำ</div>
          </div>

          <div className="bento-card bento-card-gradient animate-scale-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">New</span>
            </div>
            <div className="text-3xl font-bold mb-1">0%</div>
            <div className="text-sm text-muted-foreground">คะแนนเฉลี่ย</div>
          </div>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Getting Started - Large Card */}
          <div className="lg:col-span-2 bento-card bento-card-gradient animate-fade-in-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">เริ่มต้นใช้งาน</h2>
                <p className="text-muted-foreground">ทำตามขั้นตอนเพื่อเริ่มใช้งาน Exomos</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'สร้างวิชาแรกของคุณ',
                  desc: 'เพิ่มวิชาที่คุณกำลังเรียน เช่น ฟิสิกส์ เคมี หรือแคลคูลัส',
                  icon: '📚',
                  color: 'primary'
                },
                {
                  step: '02',
                  title: 'อัปโหลดโน้ตเรียน',
                  desc: 'อัปโหลดไฟล์ PDF หรือรูปภาพของโน้ตและเอกสารเรียน',
                  icon: '📄',
                  color: 'accent'
                },
                {
                  step: '03',
                  title: 'เก็งข้อสอบด้วย AI',
                  desc: 'ให้ AI สร้างข้อสอบจากเนื้อหาที่คุณอัปโหลด พร้อมอ้างอิงแหล่งที่มา',
                  icon: '🤖',
                  color: 'secondary'
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all group"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-card border-2 border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">{item.step}</span>
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              disabled
              className="w-full mt-6 py-3 rounded-xl bg-muted text-muted-foreground font-semibold cursor-not-allowed"
            >
              เร็วๆ นี้
            </button>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* User Card */}
            <div className="bento-card bento-card-gradient animate-scale-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">{user.email}</h3>
                  <p className="text-xs text-muted-foreground">บัญชีของคุณ</p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">สถานะ</span>
                  <span className="font-medium text-primary">ใช้งานได้</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">สมาชิกตั้งแต่</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString('th-TH', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bento-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 animate-scale-in" style={{ animationDelay: '0.7s', opacity: 0 }}>
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ระบบพร้อมใช้งาน</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Authentication เสร็จสมบูรณ์แล้ว
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-primary">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Card */}
            <div className="bento-card bg-gradient-to-br from-accent/5 to-secondary/5 border-accent/20 animate-scale-in" style={{ animationDelay: '0.8s', opacity: 0 }}>
              <div className="text-4xl mb-4">💡</div>
              <p className="text-sm font-medium mb-2 leading-relaxed">
                "การศึกษาคือการจุดประกายความคิด ไม่ใช่การเติมเต็มภาชนะ"
              </p>
              <p className="text-xs text-muted-foreground">— William Butler Yeats</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
