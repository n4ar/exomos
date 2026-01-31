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

interface ExamGenerationClientProps {
  subjects: Subject[]
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'ง่าย', description: 'แนวคิดและคำจำกัดความพื้นฐาน', emoji: '🟢' },
  { value: 'medium', label: 'ปานกลาง', description: 'การประยุกต์และวิเคราะห์', emoji: '🟡' },
  { value: 'hard', label: 'ยาก', description: 'การแก้ปัญหาขั้นสูง', emoji: '🔴' },
] as const

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'ปรนัย', emoji: '☑️' },
  { value: 'true_false', label: 'จริง/เท็จ', emoji: '✓✗' },
  { value: 'short_answer', label: 'อัตนัย', emoji: '✍️' },
] as const

export function ExamGenerationClient({ subjects }: ExamGenerationClientProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')

  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [title, setTitle] = useState('')
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [topics, setTopics] = useState('')
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([
    'multiple_choice',
    'true_false',
  ])

  const steps = ['เลือกวิชา', 'ตั้งค่าข้อสอบ', 'สร้างข้อสอบ']

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject)

  const toggleQuestionType = (type: string) => {
    if (selectedQuestionTypes.includes(type)) {
      setSelectedQuestionTypes(selectedQuestionTypes.filter((t) => t !== type))
    } else {
      setSelectedQuestionTypes([...selectedQuestionTypes, type])
    }
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
    if (currentStep === 1 && !title.trim()) {
      toast.error('กรุณาใส่ชื่อข้อสอบ')
      return
    }
    if (currentStep === 1 && selectedQuestionTypes.length === 0) {
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
            <h2 className="text-2xl font-bold mb-2">Select a Subject</h2>
            <p className="text-muted-foreground">
              Choose the subject you want to create an exam for
            </p>
          </div>

          {subjects.length === 0 ? (
            <BentoCard className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No subjects found</h3>
              <p className="text-muted-foreground mb-4">
                Create a subject and upload notes first
              </p>
              <a
                href="/subjects"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 transition-all"
              >
                Go to Subjects
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
                      {subject._count.notes} notes
                    </span>
                  </div>
                  {subject._count.notes === 0 && (
                    <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                      ⚠️ No notes available. Upload notes first.
                    </div>
                  )}
                </BentoCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Configure Exam */}
      {currentStep === 1 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Configure Your Exam</h2>
            <p className="text-muted-foreground">
              Set up the exam details and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exam Title */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  Exam Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Exam - Chapter 1-3"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </BentoCard>

              {/* Question Count */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  Number of Questions
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
                    <span className="text-sm text-muted-foreground">5 questions</span>
                    <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-bold">
                      {questionCount}
                    </div>
                    <span className="text-sm text-muted-foreground">50 questions</span>
                  </div>
                </div>
              </BentoCard>

              {/* Difficulty */}
              <BentoCard>
                <label className="block text-sm font-medium mb-3">
                  Difficulty Level
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
                      <div className="text-2xl mb-2">{option.emoji}</div>
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
                  Question Types
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
                      <span className="text-xl">{type.emoji}</span>
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </BentoCard>

              {/* Topics (Optional) */}
              <BentoCard>
                <label className="block text-sm font-medium mb-2">
                  Topics (Optional)
                </label>
                <textarea
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g., Photosynthesis, Cell Structure (comma separated)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Leave empty to include all topics from the notes
                </p>
              </BentoCard>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-4">
              <BentoCard className="sticky top-24">
                <h3 className="font-semibold mb-4">Exam Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                    {selectedSubjectData && (
                      <SubjectBadge
                        name={selectedSubjectData.name}
                        color={selectedSubjectData.color || '#6366f1'}
                        size="sm"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Title</p>
                    <p className="font-medium text-sm">
                      {title || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Questions</p>
                    <p className="font-medium">{questionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                    <p className="font-medium capitalize">{difficulty}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Question Types</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedQuestionTypes.map((type) => {
                        const typeData = QUESTION_TYPES.find((t) => t.value === type)
                        return (
                          <span
                            key={type}
                            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                          >
                            {typeData?.emoji} {typeData?.label}
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

      {/* Step 2: Review & Generate */}
      {currentStep === 2 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 } as any}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Ready to Generate</h2>
            <p className="text-muted-foreground">
              Review your settings and generate the exam
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
              <h3 className="text-2xl font-bold mb-2">All Set!</h3>
              <p className="text-muted-foreground mb-8">
                Click below to generate your exam with AI
              </p>

              <div className="bg-muted/30 rounded-xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium">{selectedSubjectData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium capitalize">{difficulty}</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary text-white font-semibold hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all text-lg"
              >
                🤖 Generate Exam with AI
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
          ← Back
        </button>
        {currentStep < 2 && (
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
