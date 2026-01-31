'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)

      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              สำเร็จ!
            </h1>
            <div className="ornamental-divider">
              <span className="text-2xl text-accent">❖</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              รหัสผ่านของคุณถูกอัปเดตเรียบร้อยแล้ว กำลังนำคุณไปยังแดชบอร์ด...
            </p>
          </div>
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
            <div className="inline-block px-4 py-1 border border-accent/20 text-xs tracking-[0.2em] uppercase text-accent font-medium">
              Security Update
            </div>
            <h1 className="text-6xl lg:text-7xl leading-[0.95] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              New<br />
              <span className="italic font-light">Password</span>
            </h1>
          </div>

          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground max-w-md">
            <p className="drop-cap">
              ตั้งรหัสผ่านใหม่ที่แข็งแรงและปลอดภัย เพื่อปกป้องบัญชีและข้อมูลการเรียนของคุณ
            </p>
            <div className="ornamental-divider">
              <span className="text-2xl text-accent">❖</span>
            </div>
            <div className="space-y-3 text-base">
              <p className="font-medium text-foreground">คำแนะนำสำหรับรหัสผ่านที่ดี:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✦</span>
                  <span>ใช้อย่างน้อย 8 ตัวอักษร</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✦</span>
                  <span>ผสมตัวอักษรพิมพ์ใหญ่และเล็ก</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent mt-1">✦</span>
                  <span>เพิ่มตัวเลขและสัญลักษณ์พิเศษ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Update Password Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="bg-card border border-border shadow-2xl p-8 lg:p-12">
            {/* Header */}
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                ตั้งรหัสผ่านใหม่
              </h2>
              <p className="text-muted-foreground text-sm">
                กรอกรหัสผ่านใหม่ของคุณ
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 border-l-4 border-destructive bg-destructive/5 animate-slide-in-right">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium tracking-wide uppercase text-xs">
                  รหัสผ่านใหม่
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 outline-none text-base"
                  placeholder="••••••••"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
                <p className="text-xs text-muted-foreground italic">อย่างน้อย 6 ตัวอักษร</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium tracking-wide uppercase text-xs">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 outline-none text-base"
                  placeholder="••••••••"
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
                  {loading ? 'กำลังอัปเดต...' : 'อัปเดตรหัสผ่าน'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            </form>
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
