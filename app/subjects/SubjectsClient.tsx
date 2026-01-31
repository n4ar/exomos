'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BentoCard, BentoCardHeader, BentoCardFooter } from '@/components/BentoCard'
import { SubjectBadge, SubjectColorPicker } from '@/components/SubjectBadge'
import { EmptyDataState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Link from 'next/link'
import { toast } from 'sonner'

interface Subject {
  id: string
  name: string
  description: string | null
  color: string | null
  createdAt: Date
  _count: {
    notes: number
    exams: number
  }
}

interface SubjectsClientProps {
  initialSubjects: Subject[]
}

export function SubjectsClient({ initialSubjects }: SubjectsClientProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter subjects by search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateSubject = async (data: {
    name: string
    description?: string
    color: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'สร้างวิชาล้มเหลว')
      }

      const newSubject = await response.json()
      setSubjects([newSubject, ...subjects])
      setIsCreateModalOpen(false)
      toast.success('สร้างวิชาสำเร็จ!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิชานี้?')) return

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ลบวิชาล้มเหลว')
      }

      setSubjects(subjects.filter((s) => s.id !== id))
      toast.success('ลบวิชาสำเร็จ!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <>
      {/* Search and Create Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="ค้นหาวิชา..."
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
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            สร้างวิชา
          </span>
        </button>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        searchQuery ? (
          <EmptyDataState
            type="subjects"
            onCreate={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <EmptyDataState
            type="subjects"
            onCreate={() => setIsCreateModalOpen(true)}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject, index) => (
            <BentoCard
              key={subject.id}
              hover
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s`, opacity: 0 } as any}
            >
              <BentoCardHeader
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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

              <div className="my-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-semibold">{subject._count.notes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exams</span>
                  <span className="font-semibold">{subject._count.exams}</span>
                </div>
              </div>

              <BentoCardFooter>
                <Link
                  href={`/subjects/${subject.id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  View Details →
                </Link>
                <button
                  onClick={() => handleDeleteSubject(subject.id)}
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

      {/* Create Subject Modal */}
      {isCreateModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <CreateSubjectModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateSubject}
            isLoading={isLoading}
          />,
          document.body
        )}
    </>
  )
}

interface CreateSubjectModalProps {
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; color: string }) => void
  isLoading: boolean
}

function CreateSubjectModal({ onClose, onSubmit, isLoading }: CreateSubjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Subject name is required')
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Create New Subject</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            disabled={isLoading}
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
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Subject Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Physics, Chemistry, Calculus"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
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
              placeholder="Brief description of the subject..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Color Picker */}
          <SubjectColorPicker value={color} onChange={setColor} />

          {/* Preview */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <SubjectBadge name={name || 'Subject Name'} color={color} size="md" />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" variant="dots" />
                  Creating...
                </span>
              ) : (
                'Create Subject'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
