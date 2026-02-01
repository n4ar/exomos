'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BentoCard } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { LoadingOverlay } from '@/components/LoadingSpinner'
import { StepProgress } from '@/components/ProgressBar'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Subject {
  id: string
  name: string
  color: string | null
  _count: {
    notes: number
  }
}

interface Note {
  id: string
  title: string
  fileName: string
  pageCount: number
  uploadedAt: string
  _count: {
    chunks: number
  }
}

interface ExamGenerationClientProps {
  subjects: Subject[]
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'ง่าย', description: 'แนวคิดและคำจำกัดความพื้นฐาน', color: 'text-green-600' },
  { value: 'medium', label: 'ปานกลาง', description: 'การประยุกต์และวิเคราะห์', color: 'text-yellow-600' },
  { value: 'hard', label: 'ยาก', description: 'การแก้ปัญหาขั้นสูง', color: 'text-red-600' },
] as const

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'ปรนัย', icon: 'checkbox' },
  { value: 'true_false', label: 'จริง/เท็จ', icon: 'check' },
] as const

export function ExamGenerationClient({ subjects }: ExamGenerationClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')

  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [title, setTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [topics, setTopics] = useState('')
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    'multiple_choice',
    'true_false',
  ])

  const steps = ['เลือกวิชา', 'เลือกโน้ต', 'ตั้งค่าข้อสอบ', 'สร้างข้อสอบ']

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject)

  // Fetch notes when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      setLoadingNotes(true)
      setSelectedNoteIds([]) // Reset selection when subject changes
      fetch(`/api/notes?subjectId=${selectedSubject}`)
        .then((res) => res.json())
        .then((data) => {
          setNotes(data.data || [])
          setLoadingNotes(false)
        })
        .catch((error) => {
          console.error('Error fetching notes:', error)
          toast.error('ดึงโน้ตล้มเหลว')
          setLoadingNotes(false)
        })
    }
  }, [selectedSubject])

  const toggleQuestionType = (type: string) => {
    if (selectedQuestionTypes.includes(type)) {
      setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== type))
    } else {
      setSelectedQuestionTypes([...selectedQuestionTypes, type])
    }
  }

  const toggleNoteSelection = (noteId: string) => {
    if (selectedNoteIds.includes(noteId)) {
      setSelectedNoteIds(selectedNoteIds.filter((id) => id !== noteId))
    } else {
      setSelectedNoteIds([...selectedNoteIds, noteId])
    }
  }

  const selectAllNotes = () => {
    setSelectedNoteIds(notes.map((n) => n.id))
  }

  const deselectAllNotes = () => {
    setSelectedNoteIds([])
  }

  const handleNext = () => {
    if (currentStep === 0 && !selectedSubject) {
      toast.error('กรุณาเลือกวิชา')
      return
    }
    if (currentStep === 0 && selectedSubjectData && selectedSubjectData._count.notes === 0) {
      toast.error('วิชานี้ยังไม่มีโน้ต กรุณาอัปโหลดโน้ตก่อน')
      return
    }
    if (currentStep === 1 && selectedNoteIds.length === 0) {
      toast.error('กรุณาเลือกโน้ตอย่างน้อย 1 รายการ')
      return
    }
    if (currentStep === 2 && !title.trim()) {
      toast.error('กรุณาใส่ชื่อข้อสอบ')
      return
    }
    if (currentStep === 2 && selectedQuestionTypes.length === 0) {
      toast.error('กรุณาเลือกประเภทคำถามอย่างน้อย 1 ประเภท')
      return
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress('กำลังวิเคราะห์โน้ตของคุณ...')

    try {
      const topicsArray = topics
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      // Simulate progress updates
      setTimeout(() => setGenerationProgress('กำลังดึงเนื้อหาที่เกี่ยวข้อง...'), 2000)
      setTimeout(() => setGenerationProgress('กำลังสร้างคำถามด้วย AI...'), 4000)
      setTimeout(() => setGenerationProgress('กำลังสร้างตัวเลือกคำตอบ...'), 6000)
      setTimeout(() => setGenerationProgress('กำลังจัดเตรียมข้อสอบ...'), 8000)

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubject,
          noteIds: selectedNoteIds.length > 0 ? selectedNoteIds : undefined,
          title: title.trim(),
          questionCount,
          difficulty,
          topics: topicsArray.length > 0 ? topicsArray : undefined,
          questionTypes:
            selectedQuestionTypes.length > 0 ? selectedQuestionTypes : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'สร้างข้อสอบล้มเหลว')
      }

      const exam = await response.json()
      toast.success('สร้างข้อสอบสำเร็จ!')
      // Use examId from response, not id
      router.push(`/exams/${exam.examId || exam.id}`)
    } catch (error: any) {
      toast.error(error.message)
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return typeof document !== 'undefined'
      ? createPortal(
          <LoadingOverlay
            message={generationProgress}
            submessage="อาจใช้เวลา 10-30 วินาที..."
          />,
          document.body
        )
      : null
  }

  return (
    <div className="space-y-8">
      {/* Step Progress */}
      <div className="animate-fade-in">
        <StepProgress steps={steps} currentStep={currentStep} />
      </div>

      {/* Step 0: Select Subject */}
      {currentStep === 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">เลือกวิชา</h2>
            <p className="text-muted-foreground">
              เลือกวิชาที่คุณต้องการสร้างข้อสอบ
            </p>
          </div>

          {subjects.length === 0 ? (
            <BentoCard className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">ไม่พบวิชา</h3>
              <p className="text-muted-foreground mb-4">
                กรุณาสร้างวิชาและอัปโหลดโน้ตก่อน
              </p>
              <a
                href="/subjects"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 transition-all"
              >
                ไปที่หน้าวิชา
              </a>
            </BentoCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subject, index) => (
                <BentoCard
                  key={subject.id}
                  hover
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`cursor-pointer transition-all duration-300 animate-scale-in ${
                    selectedSubject === subject.id
                      ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 0.1}s`, opacity: 0 } as any}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">{subject.name}</h3>
                        <SubjectBadge
                          name={subject.name}
                          color={subject.color || '#6366f1'}
                          size="sm"
                        />
                      </div>
                    </div>
                    {selectedSubject === subject.id && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {subject._count.notes} โน้ต
                    </span>
                  </div>
                  {subject._count.notes === 0 && (
                    <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      ยังไม่มีโน้ต กรุณาอัปโหลดโน้ตก่อน
                    </div>
                  )}
                </BentoCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select Notes */}
      {currentStep === 1 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">เลือกโน้ต</h2>
            <p className="text-muted-foreground">
              เลือกโน้ตที่ต้องการใช้ในการสร้างข้อสอบ
            </p>
          </div>

          {loadingNotes ? (
            <BentoCard className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-muted-foreground">กำลังโหลดโน้ต...</p>
            </BentoCard>
          ) : notes.length === 0 ? (
            <BentoCard className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">ไม่มีโน้ต</h3>
              <p className="text-muted-foreground">
                กรุณาอัปโหลดโน้ตสำหรับวิชานี้ก่อน
              </p>
            </BentoCard>
          ) : (
            <>
              {/* Selection Controls */}
              <BentoCard className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-semibold text-primary text-lg">{selectedNoteIds.length}</span>
                  <span className="text-muted-foreground"> จาก {notes.length} รายการ</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={selectAllNotes}
                    className="px-4 py-2 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-all"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    onClick={deselectAllNotes}
                    className="px-4 py-2 rounded-lg border-2 border-border text-muted-foreground font-medium hover:bg-muted transition-all"
                  >
                    ล้าง
                  </button>
                </div>
              </BentoCard>

              {/* Note Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => {
                  const isSelected = selectedNoteIds.includes(note.id)
                  return (
                    <BentoCard
                      key={note.id}
                      hover
                      onClick={() => toggleNoteSelection(note.id)}
                      className={`cursor-pointer transition-all duration-300 animate-scale-in ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                          : ''
                      }`}
                    >
                      {/* Checkbox & Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          {note.pageCount} หน้า
                        </span>
                      </div>

                      {/* Note Info */}
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">
                          {note.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1 truncate">
                          {note.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.uploadedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        {note._count.chunks} ส่วนข้อมูล
                      </div>
                    </BentoCard>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Configure Exam */}
      {currentStep === 2 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">ตั้งค่าข้อสอบ</h2>
            <p className="text-muted-foreground">
              กำหนดรายละเอียดและความต้องการของข้อสอบ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Title */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  ชื่อข้อสอบ <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ข้อสอบกลางภาค - บทที่ 1-3"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </BentoCard>

              {/* Question Count */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  จำนวนข้อ
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">5 ข้อ</span>
                    <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-bold">
                      {questionCount}
                    </div>
                    <span className="text-sm text-muted-foreground">50 ข้อ</span>
                  </div>
                </div>
              </BentoCard>

              {/* Difficulty */}
              <BentoCard>
                <label className="block text-sm font-medium mb-3">
                  ระดับความยาก
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDifficulty(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        difficulty === option.value
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mb-2 mx-auto ${option.color} bg-current`}></div>
                      <div className="font-semibold mb-1">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </BentoCard>

              {/* Question Types */}
              <BentoCard>
                <label className="block text-sm font-medium mb-3">
                  ประเภทคำถาม
                </label>
                <div className="space-y-2">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleQuestionType(type.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                        selectedQuestionTypes.includes(type.value)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedQuestionTypes.includes(type.value)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedQuestionTypes.includes(type.value) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </BentoCard>

              {/* Topics (Optional) */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  หัวข้อ (ไม่บังคับ)
                </label>
                <textarea
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="เช่น การสังเคราะห์แสง, โครงสร้างเซลล์ (คั่นด้วยจุลภาค)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  เว้นว่างไว้เพื่อรวมทุกหัวข้อจากโน้ต
                </p>
              </BentoCard>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-4">
              <BentoCard className="sticky top-24">
                <h3 className="font-semibold mb-4">สรุปข้อสอบ</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">วิชา</p>
                    {selectedSubjectData && (
                      <SubjectBadge
                        name={selectedSubjectData.name}
                        color={selectedSubjectData.color || '#6366f1'}
                        size="sm"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ชื่อ</p>
                    <p className="font-medium text-sm">
                      {title || 'ยังไม่ได้ตั้ง'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">จำนวนข้อ</p>
                    <p className="font-medium">{questionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ระดับความยาก</p>
                    <p className="font-medium capitalize">{
                      difficulty === 'easy' ? 'ง่าย' :
                      difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'
                    }</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ประเภทคำถาม</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedQuestionTypes.map((type) => {
                        const typeData = QUESTION_TYPES.find((t) => t.value === type)
                        return (
                          <span
                            key={type}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                          >
                            {typeData?.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </BentoCard>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Generate */}
      {currentStep === 3 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">พร้อมสร้างข้อสอบ</h2>
            <p className="text-muted-foreground">
              ตรวจสอบการตั้งค่าและสร้างข้อสอบ
            </p>
          </div>

          <BentoCard className="max-w-2xl mx-auto">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">พร้อมแล้ว!</h3>
              <p className="text-muted-foreground mb-8">
                คลิกด้านล่างเพื่อสร้างข้อสอบด้วย AI
              </p>

              <div className="bg-muted/30 rounded-xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วิชา:</span>
                  <span className="font-medium">{selectedSubjectData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ชื่อ:</span>
                  <span className="font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">จำนวนข้อ:</span>
                  <span className="font-medium">{questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ระดับความยาก:</span>
                  <span className="font-medium capitalize">{
                    difficulty === 'easy' ? 'ง่าย' :
                    difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'
                  }</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all text-lg flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                สร้างข้อสอบด้วย AI
              </button>
            </div>
          </BentoCard>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← ก่อนหน้า
        </button>
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            ถัดไป →
          </button>
        )}
      </div>
    </div>
  )
}
