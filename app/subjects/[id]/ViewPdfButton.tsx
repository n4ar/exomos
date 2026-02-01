'use client'

import { toast } from 'sonner'

interface ViewPdfButtonProps {
  noteId: string
}

export function ViewPdfButton({ noteId }: ViewPdfButtonProps) {
  const handleViewPdf = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}/url`)

      if (!response.ok) {
        throw new Error('ไม่สามารถโหลด PDF ได้')
      }

      const { url } = await response.json()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเปิด PDF')
    }
  }

  return (
    <button
      onClick={handleViewPdf}
      className="text-sm text-primary hover:underline font-medium"
    >
      ดู PDF →
    </button>
  )
}
