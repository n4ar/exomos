'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { SubjectBadge } from '@/components/SubjectBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { LoadingOverlay } from '@/components/LoadingSpinner'
import { toast } from 'sonner'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string | null
  orderIndex: number
}

interface Exam {
  id: string
  title: string
  difficulty: string
  status: string
  subject: {
    name: string
    color: string | null
  }
  questions: Question[]
}

interface ExamTakingClientProps {
  exam: Exam
}

export function ExamTakingClient({ exam }: ExamTakingClientProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  const sortedQuestions = [...exam.questions].sort((a, b) => a.orderIndex - b.orderIndex)
  const currentQuestion = sortedQuestions[currentQuestionIndex]
  const totalQuestions = sortedQuestions.length
  const answeredCount = Object.values(answers).filter(answer => answer && answer.trim() !== '').length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // Get options with fallback for empty arrays
  const getQuestionOptions = (question: Question): string[] => {
    if (question.options && question.options.length > 0) {
      return question.options
    }

    // Fallback: If options is empty, check if it looks like a true/false question
    const questionText = question.questionText.toLowerCase()
    const isTrueFalse =
      questionText.includes('ถูก') ||
      questionText.includes('ผิด') ||
      questionText.includes('จริง') ||
      questionText.includes('เท็จ') ||
      questionText.includes('true') ||
      questionText.includes('false') ||
      question.correctAnswer.toLowerCase() === 'true' ||
      question.correctAnswer.toLowerCase() === 'false' ||
      question.correctAnswer === 'จริง' ||
      question.correctAnswer === 'เท็จ'

    if (isTrueFalse) {
      return ['จริง', 'เท็จ']
    }

    // Default fallback: create options with correct answer
    return [
      question.correctAnswer,
      'ตัวเลือกอื่น 1',
      'ตัวเลือกอื่น 2',
      'ตัวเลือกอื่น 3'
    ]
  }

  // Load answers from localStorage on mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`exam-${exam.id}-answers`)
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers))
    }
  }, [exam.id])

  // Auto-save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`exam-${exam.id}-answers`, JSON.stringify(answers))
    }
  }, [answers, exam.id])

  // Timer
  useEffect(() => {
    if (!isTimerRunning) return

    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const unanswered = totalQuestions - answeredCount
      const confirmSubmit = confirm(
        `คุณยังไม่ได้ตอบคำถาม ${unanswered} ข้อ คุณแน่ใจหรือไม่ว่าต้องการส่งข้อสอบ?`
      )
      if (!confirmSubmit) return
    }

    setIsSubmitModalOpen(true)
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    setIsTimerRunning(false)

    try {
      // Format answers for API
      const formattedAnswers = sortedQuestions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }))

      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit exam')
      }

      // Clear saved answers from localStorage
      localStorage.removeItem(`exam-${exam.id}-answers`)

      toast.success('Exam submitted successfully!')
      router.push(`/exams/${exam.id}/results`)
    } catch (error: any) {
      toast.error(error.message)
      setIsSubmitting(false)
      setIsTimerRunning(true)
    }
  }

  if (isSubmitting) {
    return (
      <LoadingOverlay
        message="Submitting your exam..."
        submessage="Calculating your score..."
      />
    )
  }

  return (
    <>
      {/* Exam Header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{exam.title}</h1>
              <SubjectBadge
                name={exam.subject.name}
                color={exam.subject.color || '#6366f1'}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    exam.difficulty === 'easy'
                      ? 'bg-green-500'
                      : exam.difficulty === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
              </span>
              <span>{totalQuestions} Questions</span>
              <span>{answeredCount} Answered</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold font-mono tabular-nums">
              {formatTime(timeElapsed)}
            </div>
            <div className="text-xs text-muted-foreground">Time Elapsed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <ProgressBar value={progress} variant="gradient" />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6 animate-scale-in">
        {/* Question Number */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
          {answers[currentQuestion.id] && (
            <div className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Answered
            </div>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-xl md:text-2xl font-semibold mb-6 leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        {/* Answer Options */}
        <div className="space-y-3">
          {getQuestionOptions(currentQuestion).map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index) // A, B, C, D
            const isSelected = answers[currentQuestion.id] === option

            return (
              <label
                key={index}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={isSelected}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="mt-1 w-5 h-5 text-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-primary">
                      {optionLabel}.
                    </span>
                  </div>
                  <p className="text-base leading-relaxed">{option}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </span>
        </button>

        {/* Question Navigator */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 min-w-max px-4">
            {sortedQuestions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                  index === currentQuestionIndex
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20'
                    : answers[q.id]
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <span className="flex items-center gap-2">
              Submit Exam
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:scale-105 transition-all"
          >
            <span className="flex items-center gap-2">
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSubmitModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold text-center mb-2">Submit Exam?</h3>
                <p className="text-muted-foreground text-center mb-6">
                  You have answered {answeredCount} out of {totalQuestions} questions.
                  <br />
                  Once submitted, you cannot change your answers.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
                  >
                    Review Again
                  </button>
                  <button
                    onClick={confirmSubmit}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    Submit Now
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
