import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '@/lib/prisma'
import { getExamContext } from '@/lib/rag-pipeline'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export interface GenerateExamParams {
  userId: string
  subjectId: string
  title: string
  multipleChoiceCount: number
  trueFalseCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  topics?: string[]
  noteIds?: string[]
}

export interface GeneratedQuestion {
  question: string
  type: 'multiple_choice' | 'true_false'
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
  multipleChoiceCount,
  trueFalseCount,
  difficulty,
  topics,
  noteIds,
}: GenerateExamParams) {
  const totalQuestions = multipleChoiceCount + trueFalseCount

  // 1. Get relevant context from user's notes using RAG
  const context = await getExamContext(userId, subjectId, topics, noteIds)

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
      totalQuestions,
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
- จำนวนข้อปรนัย (multiple choice): ${multipleChoiceCount} ข้อ
- จำนวนข้อจริง/เท็จ (true/false): ${trueFalseCount} ข้อ
- รวมทั้งหมด: ${totalQuestions} ข้อ
- ระดับความยาก: ${difficulty}
${topics && topics.length > 0 ? `- หัวข้อที่ต้องครอบคลุม: ${topics.join(', ')}` : ''}

**รูปแบบ JSON ที่ต้องการ:**
{
  "questions": [
    {
      "question": "คำถาม",
      "type": "multiple_choice | true_false",
      "options": ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"],
      "correctAnswer": "คำตอบที่ถูกต้อง",
      "explanation": "คำอธิบายว่าทำไมคำตอบนี้ถูกต้อง พร้อมอ้างอิงจากเนื้อหา",
      "difficulty": "${difficulty}"
    }
  ]
}

**หมายเหตุ:**
- สำหรับข้อปรนัย (multiple_choice): ให้มี 4 ตัวเลือก
- สำหรับข้อจริง/เท็จ (true_false): ให้มี 2 ตัวเลือก ["จริง", "เท็จ"]

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

  // 4. Validate and fix questions
  const validatedQuestions = questions.map((q, index) => {
    // Ensure options exist for multiple choice and true/false questions
    let options = q.options || []

    // If it's a multiple choice or true/false question but has no options, create default ones
    if (q.type === 'true_false' && options.length === 0) {
      options = ['จริง', 'เท็จ']
      // Make sure correctAnswer is one of these
      if (!['จริง', 'เท็จ', 'True', 'False', 'true', 'false'].includes(q.correctAnswer)) {
        q.correctAnswer = 'จริง' // Default to true
      }
    } else if (q.type === 'multiple_choice' && options.length < 2) {
      // If multiple choice has less than 2 options, it's invalid
      console.warn(`Question ${index + 1} is multiple choice but has insufficient options:`, q)
      // Try to create basic options including the correct answer
      options = [
        q.correctAnswer,
        'ไม่ทราบ',
        'ไม่มีข้อมูล',
        'ไม่ถูกต้อง'
      ]
    }

    return {
      ...q,
      options,
    }
  })

  // 5. Store questions in database
  const createdQuestions = await Promise.all(
    validatedQuestions.map(async (q, index) => {
      return prisma.question.create({
        data: {
          examId: exam.id,
          questionText: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          orderIndex: index + 1,
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

    // Skip if no answer provided
    if (!answer.answer || answer.answer.trim() === '') continue

    const userAnswer = answer.answer
    const isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    if (isCorrect) correctCount++

    answerRecords.push({
      questionId: answer.questionId,
      userId,
      selectedAnswer: userAnswer,
      isCorrect,
    })
  }

  // 3. Store answers
  await prisma.answer.createMany({
    data: answerRecords,
  })

  const score = (correctCount / exam.totalQuestions) * 100

  // 4. Update exam status
  await prisma.exam.update({
    where: { id: examId },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  })

  // 5. Update performance tracking
  await prisma.performance.create({
    data: {
      userId,
      subjectId: exam.subjectId,
      topic: exam.title,
      score,
    },
  })

  return {
    score,
    correctCount,
    totalQuestions: exam.totalQuestions,
    passed: score >= 60,
  }
}
