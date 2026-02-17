'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success('อัปเดตรหัสผ่านเรียบร้อยแล้ว')
      setPassword('')
      setConfirmPassword('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
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
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">อย่างน้อย 6 ตัวอักษร</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
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
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
      >
        <span className="relative z-10">
          {loading ? 'กำลังอัปเดต...' : 'อัปเดตรหัสผ่าน'}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </form>
  )
}
