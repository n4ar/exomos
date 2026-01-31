import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '@/lib/prisma'
import { getExamContext } from '@/lib/rag-pipeline'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export interface GenerateExamParams {
  userId: string
  subjectId: string
  title: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  topics?: string[]
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[]
}

export interface GeneratedQuestion {
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Generate exam questions using RAG + Gemini
 */
export async function generateExam({
  userId,
  subjectId,
  title,
  questionCount,
  difficulty,
  topics,
  questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
}: GenerateExamParams) {
  // 1. Get relevant context from user's notes using RAG
  const context = await getExamContext(userId, subjectId, topics)

  if (!context || context.trim().length === 0) {
    throw new Error('ไม่พบเนื้อหาในบันทึกของคุณ กรุณาอัปโหลดบันทึกก่อน')
  }

  // 2. Create exam record
  const exam = await prisma.exam.create({
    data: {
      userId,
      subjectId,
      title,
      difficulty,
      totalQuestions: questionCount,
      status: 'draft',
    },
  })

  // 3. Generate questions using Gemini with strict RAG
  const prompt = `คุณเป็นผู้สร้างข้อสอบที่เชี่ยวชาญ กรุณาสร้างข้อสอบจากเนื้อหาที่ให้มาเท่านั้น (Strict RAG)

**กฎสำคัญ:**
- ใช้เฉพาะข้อมูลจากเนื้อหาที่ให้มาเท่านั้น ห้ามใช้ความรู้ภายนอก
- ถ้าเนื้อหาไม่เพียงพอ ให้สร้างข้อสอบน้อยลงตามความเหมาะสม
- คำถามต้องชัดเจน ตรงประเด็น และมีคำตอบที่แน่นอน

**เนื้อหาจากบันทึก:**
${context}

**ข้อกำหนด:**
- จำนวนข้อ: ${questionCount} ข้อ
- ระดับความยาก: ${difficulty}
- ประเภทคำถาม: ${questionTypes.join(', ')}
${topics && topics.length > 0 ? `- หัวข้อที่ต้องครอบคลุม: ${topics.join(', ')}` : ''}

**รูปแบบ JSON ที่ต้องการ:**
{
  "questions": [
    {
      "question": "คำถาม",
      "type": "multiple_choice | true_false | short_answer",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
      "correctAnswer": "คำตอบที่ถูกต้อง",
      "explanation": "คำอธิบายว่าทำไมคำตอบนี้ถูกต้อง พร้อมอ้างอิงจากเนื้อหา",
      "difficulty": "${difficulty}"
    }
  ]
}

กรุณาสร้างข้อสอบในรูปแบบ JSON เท่านั้น ไม่ต้องมีข้อความอื่น`

  const result = await model.generateContent(prompt)
  const response = result.response.text()

  // Parse JSON response
  let questions: GeneratedQuestion[]
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : response
    const parsed = JSON.parse(jsonStr)
    questions = parsed.questions
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    throw new Error('ไม่สามารถสร้างข้อสอบได้ กรุณาลองใหม่อีกครั้ง')
  }

  // 4. Store questions in database
  const createdQuestions = await Promise.all(
    questions.map(async (q, index) => {
      return prisma.question.create({
        data: {
          examId: exam.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          order: index + 1,
        },
      })
    })
  )

  // 5. Update exam status
  await prisma.exam.update({
    where: { id: exam.id },
    data: { status: 'ready' },
  })

  return {
    examId: exam.id,
    questions: createdQuestions,
  }
}

export interface SubmitAnswerParams {
  examId: string
  userId: string
  answers: Array<{
    questionId: string
    answer: string
  }>
}

/**
 * Submit exam answers and calculate score
 */
export async function submitExam({ examId, userId, answers }: SubmitAnswerParams) {
  // 1. Get exam with questions
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  })

  if (!exam) {
    throw new Error('ไม่พบข้อสอบ')
  }

  if (exam.userId !== userId) {
    throw new Error('คุณไม่มีสิทธิ์เข้าถึงข้อสอบนี้')
  }

  // 2. Calculate score
  let correctCount = 0
  const answerRecords = []

  for (const answer of answers) {
    const question = exam.questions.find((q) => q.id === answer.questionId)
    if (!question) continue

    const isCorrect = answer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    if (isCorrect) correctCount++

    answerRecords.push({
      examId,
      questionId: answer.questionId,
      userAnswer: answer.answer,
      isCorrect,
    })
  }

  // 3. Store answers
  await prisma.answer.createMany({
    data: answerRecords,
  })

  const score = (correctCount / exam.totalQuestions) * 100

  // 4. Update exam status and score
  await prisma.exam.update({
    where: { id: examId },
    data: {
      status: 'completed',
      score,
      completedAt: new Date(),
    },
  })

  // 5. Update performance tracking
  await prisma.performance.create({
    data: {
      userId,
      subjectId: exam.subjectId,
      examId,
      score,
      correctAnswers: correctCount,
      totalQuestions: exam.totalQuestions,
    },
  })

  return {
    score,
    correctCount,
    totalQuestions: exam.totalQuestions,
    passed: score >= 60,
  }
}
