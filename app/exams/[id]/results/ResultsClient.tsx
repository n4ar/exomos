'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BentoCard } from '@/components/BentoCard'
import { SubjectBadge } from '@/components/SubjectBadge'
import { ScoreCircle } from '@/components/ScoreCircle'
import { ProgressBar } from '@/components/ProgressBar'

interface Question {
  id: string
  questionText: string
  options: string[]
  correctAnswer: string
  explanation?: string
  orderIndex: number
  answers?: Answer[]
}

interface Answer {
  id: string
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
}

interface Exam {
  id: string
  title: string
  difficulty: string
  score?: number
  totalQuestions: number
  correctAnswers?: number
  subject: {
    name: string
    color: string
  }
  questions: Question[]
  createdAt: string
  completedAt?: string
}

interface ResultsClientProps {
  exam: Exam
}

export default function ResultsClient({ exam }: ResultsClientProps) {
  const router = useRouter()
  const [showExplanations, setShowExplanations] = useState(false)

  // Calculate score from questions with answers
  const sortedQuestions = [...exam.questions].sort((a, b) => a.orderIndex - b.orderIndex)
  const correctAnswers = sortedQuestions.filter(q => q.answers?.[0]?.isCorrect).length
  const scorePercentage = Math.round((correctAnswers / exam.totalQuestions) * 100)

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

  const getScoreStatus = (score: number): 'excellent' | 'good' | 'average' | 'poor' => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'average'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600'
      case 'good':
        return 'text-blue-600'
      case 'average':
        return 'text-amber-600'
      case 'poor':
        return 'text-rose-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'ยอดเยี่ยม! คุณเข้าใจเนื้อหาอย่างลึกซึ้ง'
      case 'good':
        return 'ดีมาก! คุณมีความเข้าใจที่ดี'
      case 'average':
        return 'พอใช้ แต่ควรทบทวนเนื้อหาเพิ่มเติม'
      case 'poor':
        return 'ควรทบทวนเนื้อหาอีกครั้ง'
      default:
        return ''
    }
  }

  const status = getScoreStatus(scorePercentage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-thai">ผลการสอบ</h1>
            <p className="text-gray-600 font-thai">{exam.title}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all font-thai"
          >
            กลับหน้าหลัก
          </button>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Score Card */}
          <BentoCard className="lg:col-span-2 p-8" gradient>
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <ScoreCircle
                  score={scorePercentage}
                  size={180}
                  status={status}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <SubjectBadge color={exam.subject.color} variant="solid">
                    {exam.subject.name}
                  </SubjectBadge>
                  <span className={`text-lg font-semibold ${getStatusColor(status)} font-thai`}>
                    {getStatusMessage(status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1 font-thai">คำตอบที่ถูก</div>
                    <div className="text-2xl font-bold text-green-600">
                      {correctAnswers}/{exam.totalQuestions}
                    </div>
                  </div>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1 font-thai">คะแนน</div>
                    <div className="text-2xl font-bold text-indigo-600">{scorePercentage}%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 font-thai">ความแม่นยำ</span>
                    <span className="font-semibold text-gray-900">{scorePercentage}%</span>
                  </div>
                  <ProgressBar value={scorePercentage} variant="gradient" />
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Stats Card */}
          <BentoCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-thai">สถิติ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700 font-thai">ถูก</span>
                </div>
                <span className="font-bold text-green-600">{correctAnswers}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span className="text-sm text-gray-700 font-thai">ผิด</span>
                </div>
                <span className="font-bold text-rose-600">
                  {exam.totalQuestions - correctAnswers}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  <span className="text-sm text-gray-700 font-thai">ทั้งหมด</span>
                </div>
                <span className="font-bold text-indigo-600">{exam.totalQuestions}</span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1 font-thai">ระดับความยาก</div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      exam.difficulty === 'easy'
                        ? 'bg-green-500'
                        : exam.difficulty === 'medium'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-sm font-semibold text-gray-700 font-thai">
                    {exam.difficulty === 'easy'
                      ? 'ง่าย'
                      : exam.difficulty === 'medium'
                      ? 'ปานกลาง'
                      : 'ยาก'}
                  </span>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Toggle Explanations */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-thai">รายละเอียดคำตอบ</h2>
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all font-thai"
          >
            {showExplanations ? 'ซ่อนคำอธิบาย' : 'แสดงคำอธิบาย'}
          </button>
        </div>

        {/* Question Review */}
        <div className="space-y-4">
          {sortedQuestions.map((question, index) => {
            const answer = question.answers?.[0] // Get the first (and only) answer for this user
            const isCorrect = answer?.isCorrect || false
            const userAnswer = answer?.selectedAnswer || 'ไม่ได้ตอบ'

            return (
              <BentoCard
                key={question.id}
                className={`p-6 ${
                  isCorrect
                    ? 'border-l-4 border-green-500'
                    : 'border-l-4 border-rose-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Question Number Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isCorrect
                        ? 'bg-green-100 text-green-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    {/* Question Text */}
                    <p className="text-lg text-gray-900 mb-4 font-thai leading-relaxed">
                      {question.questionText}
                    </p>

                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {getQuestionOptions(question).map((option, optIdx) => {
                        const isUserAnswer = option === userAnswer
                        const isCorrectAnswer = option === question.correctAnswer

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border-2 ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-50'
                                : isUserAnswer && !isCorrect
                                ? 'border-rose-500 bg-rose-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrectAnswer && (
                                <span className="text-green-600 font-semibold">✓</span>
                              )}
                              {isUserAnswer && !isCorrect && (
                                <span className="text-rose-600 font-semibold">✗</span>
                              )}
                              <span
                                className={`font-thai ${
                                  isCorrectAnswer
                                    ? 'text-green-700 font-semibold'
                                    : isUserAnswer && !isCorrect
                                    ? 'text-rose-700'
                                    : 'text-gray-700'
                                }`}
                              >
                                {option}
                              </span>
                              {isCorrectAnswer && (
                                <span className="ml-auto text-xs text-green-600 font-semibold font-thai">
                                  คำตอบที่ถูก
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* User Answer Summary */}
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-gray-600 font-thai">คำตอบของคุณ:</span>
                      <span
                        className={`font-semibold font-thai ${
                          isCorrect ? 'text-green-600' : 'text-rose-600'
                        }`}
                      >
                        {userAnswer}
                      </span>
                      {isCorrect ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold font-thai">
                          ✓ ถูกต้อง
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold font-thai">
                          ✗ ผิด
                        </span>
                      )}
                    </div>

                    {/* Explanation */}
                    {showExplanations && question.explanation && (
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <div className="text-sm font-semibold text-indigo-900 mb-1 font-thai">
                              คำอธิบาย
                            </div>
                            <p className="text-sm text-indigo-700 leading-relaxed font-thai whitespace-pre-wrap">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </BentoCard>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => router.push(`/subjects/${exam.subject}`)}
            className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all font-thai"
          >
            ดูเนื้อหาวิชานี้
          </button>
          <button
            onClick={() => router.push('/exams/new')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all font-thai"
          >
            สร้างข้อสอบใหม่
          </button>
        </div>
      </div>
    </div>
  )
}
