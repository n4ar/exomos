'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 border-2 border-accent">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              ตรวจสอบอีเมล
            </h1>
            <div className="ornamental-divider">
              <span className="text-2xl text-accent">❖</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground font-medium tracking-wide uppercase text-sm hover:bg-primary/90 transition-all duration-300"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px),
                           repeating-linear-gradient(-45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)`
        }} />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Column - Editorial Content */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-block px-4 py-1 border border-primary/20 text-xs tracking-[0.2em] uppercase text-primary font-medium">
              Account Recovery
            </div>
            <h1 className="text-6xl lg:text-7xl leading-[0.95] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Reset<br />
              <span className="italic font-light">Password</span>
            </h1>
          </div>

          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground max-w-md">
            <p className="drop-cap">
              ลืมรหัสผ่านไม่ใช่เรื่องใหญ่ กรอกอีเมลของคุณแล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
            </p>
            <div className="ornamental-divider">
              <span className="text-2xl text-accent">❖</span>
            </div>
            <p className="text-base italic">
              "ความผิดพลาดคือโอกาสในการเรียนรู้"
            </p>
          </div>
        </div>

        {/* Right Column - Reset Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="bg-card border border-border shadow-2xl p-8 lg:p-12">
            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                รีเซ็ตรหัสผ่าน
              </h2>
              <p className="text-muted-foreground text-sm">
                กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 border-l-4 border-destructive bg-destructive/5 animate-slide-in-right">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium tracking-wide uppercase text-xs">
                  อีเมล
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 outline-none text-base"
                  placeholder="your@email.com"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground font-medium tracking-wide uppercase text-sm hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="relative z-10">
                  {loading ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 ornamental-divider">
              <span className="text-accent">✦</span>
            </div>

            {/* Back to Sign In */}
            <p className="text-center text-sm text-muted-foreground">
              จำรหัสผ่านได้แล้ว?{' '}
              <Link
                href="/auth/signin"
                className="text-primary hover:text-primary/80 transition-colors font-medium underline decoration-1 underline-offset-4"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs text-muted-foreground italic">
            Exomos — Personal AI Exam Predictor
          </p>
        </div>
      </div>
    </div>
  )
}
