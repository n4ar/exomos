'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { BentoCard } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: string
  explanation?: string
  orderIndex: number
}

interface Exam {
  id: string
  title: string
  difficulty: string
  questionCount: number
  subject: {
    name: string
    color: string
  }
  questions: Question[]
  createdAt: string
}

interface ExamClientProps {
  exam: Exam
}

interface Answer {
  questionId: string
  selectedAnswer: string
}

export default function ExamClient({ exam }: ExamClientProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const currentQuestion = exam.questions[currentQuestionIndex]
  const totalQuestions = exam.questions.length
  const answeredCount = Object.keys(answers).length

  // Load saved answers from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`exam_${exam.id}_answers`)
    const savedTime = localStorage.getItem(`exam_${exam.id}_time`)

    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers))
      } catch (e) {
        console.error('Failed to load saved answers:', e)
      }
    }

    if (savedTime) {
      setTimeElapsed(parseInt(savedTime, 10))
    }
  }, [exam.id])

  // Auto-save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`exam_${exam.id}_answers`, JSON.stringify(answers))
    }
  }, [answers, exam.id])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1
        localStorage.setItem(`exam_${exam.id}_time`, newTime.toString())
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [exam.id])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index)
    }
  }

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const unanswered = totalQuestions - answeredCount
      if (!confirm(`คุณยังไม่ได้ตอบคำถาม ${unanswered} ข้อ คุณแน่ใจหรือไม่ว่าต้องการส่งข้อสอบ?`)) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      const answersArray: Answer[] = exam.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || '',
      }))

      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit exam')
      }

      // Clear saved data
      localStorage.removeItem(`exam_${exam.id}_answers`)
      localStorage.removeItem(`exam_${exam.id}_time`)

      toast.success('ส่งข้อสอบสำเร็จ!')
      router.push(`/exams/${exam.id}/results`)
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถส่งข้อสอบได้')
    } finally {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const getQuestionType = (question: Question): QuestionType => {
    if (question.options.length === 2 &&
        (question.options.includes('จริง') || question.options.includes('True'))) {
      return 'true_false'
    }
    if (question.options.length >= 3) {
      return 'multiple_choice'
    }
    return 'short_answer'
  }

  const renderQuestion = (question: Question) => {
    const type = getQuestionType(question)
    const currentAnswer = answers[question.id] || ''

    if (type === 'multiple_choice' || type === 'true_false') {
      return (
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <label
              key={idx}
              className={`
                block p-4 rounded-xl border-2 cursor-pointer transition-all
                ${
                  currentAnswer === option
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-thai">{option}</span>
              </div>
            </label>
          ))}
        </div>
      )
    }

    // Short answer
    return (
      <textarea
        value={currentAnswer}
        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
        placeholder="พิมพ์คำตอบของคุณที่นี่..."
        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none min-h-[120px] resize-y font-thai"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SubjectBadge color={exam.subject.color} variant="solid">
                {exam.subject.name}
              </SubjectBadge>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-thai">{exam.title}</h1>
                <p className="text-sm text-gray-500">
                  ระดับความยาก: {exam.difficulty === 'easy' ? 'ง่าย' : exam.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-500">เวลาที่ใช้</div>
                <div className="text-2xl font-bold text-indigo-600 font-mono">
                  {formatTime(timeElapsed)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">ความคืบหน้า</div>
                <div className="text-2xl font-bold text-purple-600">
                  {answeredCount}/{totalQuestions}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <BentoCard className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 font-thai">คำถามทั้งหมด</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {exam.questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`
                      aspect-square rounded-lg font-semibold text-sm transition-all
                      ${
                        idx === currentQuestionIndex
                          ? 'bg-indigo-600 text-white shadow-lg scale-110'
                          : answers[q.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </BentoCard>
          </div>

          {/* Question Display */}
          <div className="lg:col-span-3 space-y-6">
            <BentoCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-500 font-thai">
                  คำถามที่ {currentQuestionIndex + 1} / {totalQuestions}
                </h2>
                {answers[currentQuestion.id] && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    ✓ ตอบแล้ว
                  </span>
                )}
              </div>

              <div className="mb-8">
                <p className="text-xl text-gray-900 leading-relaxed font-thai whitespace-pre-wrap">
                  {currentQuestion.questionText}
                </p>
              </div>

              {renderQuestion(currentQuestion)}
            </BentoCard>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 font-thai"
              >
                ← ก่อนหน้า
              </button>

              <div className="flex-1" />

              {currentQuestionIndex === totalQuestions - 1 ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50 font-thai"
                >
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อสอบ'}
                </button>
              ) : (
                <button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  className="px-6 py-3 rounded-xl font-semibold transition-all bg-indigo-600 text-white hover:bg-indigo-700 font-thai"
                >
                  ถัดไป →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSubmitModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-thai">
                ยืนยันการส่งข้อสอบ
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 font-thai">คำถามทั้งหมด</span>
                  <span className="font-bold text-gray-900">{totalQuestions} ข้อ</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <span className="text-green-700 font-thai">ตอบแล้ว</span>
                  <span className="font-bold text-green-700">{answeredCount} ข้อ</span>
                </div>
                {answeredCount < totalQuestions && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <span className="text-amber-700 font-thai">ยังไม่ได้ตอบ</span>
                    <span className="font-bold text-amber-700">
                      {totalQuestions - answeredCount} ข้อ
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <span className="text-indigo-700 font-thai">เวลาที่ใช้</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {formatTime(timeElapsed)}
                  </span>
                </div>
              </div>

              {answeredCount < totalQuestions && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-thai">
                    ⚠️ คุณยังไม่ได้ตอบคำถาม {totalQuestions - answeredCount} ข้อ
                    หากส่งข้อสอบตอนนี้ คำถามที่ไม่ได้ตอบจะถูกนับว่าผิด
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 font-thai"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50 font-thai"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" variant="spinner" />
                      กำลังส่ง...
                    </span>
                  ) : (
                    'ยืนยันส่งข้อสอบ'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
