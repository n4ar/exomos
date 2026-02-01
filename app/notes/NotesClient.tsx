'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BentoCard, BentoCardHeader, BentoCardFooter } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { EmptyDataState } from '@/components/EmptyState'
import { FileUploadWithPreview } from '@/components/FileUpload'
import { LoadingSpinner, LoadingOverlay } from '@/components/LoadingSpinner'
import { toast } from 'sonner'

interface Note {
  id: string
  title: string
  fileName: string
  fileUrl: string
  pageCount: number | null
  chunkCount: number
  createdAt: Date
  subject: {
    id: string
    name: string
    color: string | null
  }
}

interface Subject {
  id: string
  name: string
  color: string | null
}

interface NotesClientProps {
  initialNotes: Note[]
  subjects: Subject[]
}

export function NotesClient({ initialNotes, subjects }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject =
      selectedSubjectFilter === 'all' || note.subject.id === selectedSubjectFilter
    return matchesSearch && matchesSubject
  })

  const handleUploadComplete = (newNote: Note) => {
    setNotes([newNote, ...notes])
    setIsUploadModalOpen(false)
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?')) return

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ลบโน้ตล้มเหลว')
      }

      setNotes(notes.filter((n) => n.id !== id))
      toast.success('ลบโน้ตสำเร็จ!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleViewPdf = async (noteId: string) => {
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
    <>
      {/* Filters and Upload Section */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ค้นหาโน้ต..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="all">ทุกวิชา</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          disabled={subjects.length === 0}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            อัปโหลดโน้ต
          </span>
        </button>
      </div>

      {/* Empty State for No Subjects */}
      {subjects.length === 0 && (
        <BentoCard className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">สร้างวิชาก่อน</h3>
          <p className="text-muted-foreground mb-4">
            คุณต้องสร้างวิชาอย่างน้อย 1 วิชาก่อนอัปโหลดโน้ต
          </p>
          <a
            href="/subjects"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 transition-all"
          >
            ไปที่หน้าวิชา
          </a>
        </BentoCard>
      )}

      {/* Notes Grid */}
      {subjects.length > 0 && filteredNotes.length === 0 ? (
        searchQuery || selectedSubjectFilter !== 'all' ? (
          <EmptyDataState
            type="notes"
            onCreate={() => setIsUploadModalOpen(true)}
          />
        ) : (
          <EmptyDataState
            type="notes"
            onCreate={() => setIsUploadModalOpen(true)}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, index) => (
            <BentoCard
              key={note.id}
              hover
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s`, opacity: 0 } as any}
            >
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
                badge={
                  <SubjectBadge
                    name={note.subject.name}
                    color={note.subject.color || '#6366f1'}
                    size="sm"
                  />
                }
              />

              <div className="my-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="truncate">{note.fileName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">หน้า</span>
                  <span className="font-semibold">{note.pageCount || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ส่วนข้อมูล</span>
                  <span className="font-semibold">{note.chunkCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">อัปโหลดเมื่อ</span>
                  <span className="font-semibold">
                    {new Date(note.createdAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>

              <BentoCardFooter>
                <button
                  onClick={() => handleViewPdf(note.id)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  ดู PDF →
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </BentoCardFooter>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <UploadNoteModal
            subjects={subjects}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadComplete={handleUploadComplete}
          />,
          document.body
        )}
    </>
  )
}

interface UploadNoteModalProps {
  subjects: Subject[]
  onClose: () => void
  onUploadComplete: (note: Note) => void
}

function UploadNoteModal({ subjects, onClose, onUploadComplete }: UploadNoteModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !title.trim() || !subjectId) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setIsUploading(true)
    setUploadProgress('กำลังเตรียมอัปโหลด...')

    try {
      // Step 1: Get presigned URL from server
      setUploadProgress('กำลังเตรียมอัปโหลด...')
      const presignedRes = await fetch('/api/notes/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          subjectId,
        }),
      })

      if (!presignedRes.ok) {
        const errorText = await presignedRes.text()
        console.error('Presigned URL error:', errorText)
        throw new Error('ไม่สามารถเตรียมอัปโหลดได้')
      }

      const { uploadUrl, key, fileUrl } = await presignedRes.json()

      // Step 2: Upload file directly to R2
      setUploadProgress('กำลังอัปโหลด PDF...')
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      })

      if (!uploadRes.ok) {
        console.error('R2 upload error:', uploadRes.status, uploadRes.statusText)
        throw new Error('อัปโหลดไฟล์ล้มเหลว')
      }

      // Step 3: Process the uploaded file
      setUploadProgress('กำลังประมวลผลโน้ต...')
      const processRes = await fetch('/api/notes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          title: title.trim(),
          description: description.trim() || undefined,
          fileKey: key,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          fileUrl,
        }),
      })

      if (!processRes.ok) {
        const errorText = await processRes.text()
        console.error('Process error:', errorText)
        let errorMessage = 'ประมวลผลโน้ตล้มเหลว'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch (e) {
          // If not JSON, use the text as error
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const newNote = await processRes.json()
      toast.success('อัปโหลดโน้ตสำเร็จ!')
      onUploadComplete(newNote)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message)
      setIsUploading(false)
    }
  }

  if (isUploading) {
    return (
      <LoadingOverlay
        message={uploadProgress}
        submessage="อาจใช้เวลาสักครู่..."
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-2xl font-bold">อัปโหลดโน้ต</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              PDF File <span className="text-destructive">*</span>
            </label>
            <FileUploadWithPreview
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onRemove={() => setSelectedFile(null)}
              accept="application/pdf"
              maxSize={100 * 1024 * 1024}
            />
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
              Subject <span className="text-destructive">*</span>
            </label>
            <select
              id="subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Note Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 1: Introduction to Physics"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the note content..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || !title.trim() || !subjectId}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Upload Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
