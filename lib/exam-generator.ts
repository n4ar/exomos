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
  // Add generation config to prevent truncation
  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 8192, // Increase token limit to prevent truncation
    responseMimeType: 'application/json', // Request JSON response format
  }

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
- ห้ามมีเครื่องหมาย comma หลังจาก property สุดท้ายใน object หรือ array
- ตรวจสอบให้แน่ใจว่า JSON ถูกต้องตามรูปแบบ
- ไม่ต้องเพิ่มข้อความหรือคำอธิบายใดๆ นอกจาก JSON

กรุณาสร้างข้อสอบในรูปแบบ JSON เท่านั้น ไม่ต้องมีข้อความอื่น ตรวจสอบให้แน่ใจว่า JSON สมบูรณ์และปิดด้วย } ที่ตำแหน่งสุดท้าย`

  // Retry logic for generating content
  let result
  let lastError
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to generate exam (attempt ${attempt}/${maxRetries})`)
      result = await model.generateContent([{ text: prompt }], generationConfig)
      break // Success, exit retry loop
    } catch (error) {
      lastError = error
      console.error(`Attempt ${attempt} failed:`, error)
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  if (!result) {
    console.error('All retry attempts failed:', lastError)
    throw new Error('ไม่สามารถสร้างข้อสอบได้ กรุณาลองใหม่อีกครั้ง')
  }

  const response = result.response.text()

  // Parse JSON response
  let questions: GeneratedQuestion[]
  try {
    // Log response length for debugging
    console.log(`Gemini response length: ${response.length} characters`)

    // Extract JSON from markdown code blocks if present
    let jsonStr = response.trim()

    // Try to extract from code blocks first
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    // Remove any text before the first { and after the last }
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace = jsonStr.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response')
    }

    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)

    // Try to fix common JSON issues before parsing
    // Remove trailing commas before closing brackets/braces
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')

    // Log the extracted JSON for debugging
    console.log('Extracted JSON preview:', jsonStr.substring(0, 500))
    console.log('Extracted JSON length:', jsonStr.length)

    const parsed = JSON.parse(jsonStr)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array')
    }

    questions = parsed.questions

    if (questions.length === 0) {
      throw new Error('No questions generated')
    }

    // Validate question count expectations
    const mcQuestions = questions.filter(q => q.type === 'multiple_choice').length
    const tfQuestions = questions.filter(q => q.type === 'true_false').length

    console.log(`Generated: ${mcQuestions} multiple choice, ${tfQuestions} true/false questions`)

    // Warn if counts don't match (but don't fail)
    if (mcQuestions !== multipleChoiceCount || tfQuestions !== trueFalseCount) {
      console.warn(`Expected ${multipleChoiceCount} MC and ${trueFalseCount} TF, got ${mcQuestions} MC and ${tfQuestions} TF`)
    }

    console.log(`Successfully parsed ${questions.length} questions`)
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    console.error('Response preview:', response.substring(0, 1000))
    console.error('Response end:', response.substring(Math.max(0, response.length - 500)))

    // Attempt to save the failed response for debugging
    try {
      const fs = await import('fs/promises')
      const debugPath = `/tmp/gemini-response-${Date.now()}.txt`
      await fs.writeFile(debugPath, response, 'utf-8')
      console.error(`Full response saved to: ${debugPath}`)
    } catch (fsError) {
      console.error('Could not save debug file:', fsError)
    }

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
