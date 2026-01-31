# Product Requirements Document: Exam Generation & Taking System

## Overview
A RAG-powered exam generation and taking system that creates intelligent exams from uploaded PDF notes and allows students to take exams with real-time progress tracking.

## Core Features

### 1. Exam Generation
**Feature**: Generate exams from uploaded notes using AI
- **Input**: Subject ID, number of questions, difficulty level
- **Process**:
  - Retrieve relevant note chunks using vector similarity search
  - Use Gemini AI to generate questions with multiple choice options
  - Store questions with correct answers and explanations
- **Output**: Created exam with generated questions

**API Endpoint**: `POST /api/exams/generate`
**Request Body**:
```json
{
  "subjectId": "uuid",
  "numQuestions": 10,
  "difficulty": "medium"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "examId": "uuid",
    "title": "Generated Exam Title",
    "totalQuestions": 10,
    "questions": [...]
  }
}
```

### 2. Exam Taking
**Feature**: Take an exam with real-time progress tracking
- **Input**: Exam ID, user answers
- **Process**:
  - Load exam questions
  - Track answered questions
  - Calculate progress percentage
  - Submit answers for grading
- **Output**: Exam results with score and feedback

**API Endpoint**: `POST /api/exams/[id]/submit`
**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "uuid",
      "answer": "A"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 80,
    "correctAnswers": 8,
    "totalQuestions": 10,
    "passed": true
  }
}
```

### 3. Exam List & Management
**Feature**: View and manage exams
- List all exams for a subject
- Filter by status (draft, published, completed)
- Delete exams
- View exam details

**API Endpoint**: `GET /api/exams?subjectId=uuid`

## User Flows

### Flow 1: Generate Exam
1. User navigates to subject page
2. User clicks "Generate Exam" button
3. User selects number of questions and difficulty
4. System retrieves relevant note chunks
5. System generates questions using AI
6. System displays generated exam
7. User can start taking the exam

### Flow 2: Take Exam
1. User navigates to exam page
2. System loads exam questions
3. User answers questions one by one
4. System tracks progress (e.g., "7/10 70%")
5. User submits exam
6. System calculates score
7. System displays results with explanations

### Flow 3: View Results
1. User views exam history
2. User selects completed exam
3. System displays score and performance
4. System shows correct/incorrect answers
5. System provides explanations for each question

## Technical Requirements

### Database Schema
- **Exam**: id, subjectId, userId, title, description, difficulty, totalQuestions, status, createdAt, completedAt
- **Question**: id, examId, questionText, options[], correctAnswer, explanation, orderIndex
- **Answer**: id, questionId, userId, selectedAnswer, isCorrect

### AI Integration
- **Model**: Google Gemini 1.5 Flash
- **Embeddings**: text-embedding-004 (768 dimensions)
- **Vector Search**: PostgreSQL with pgvector extension
- **Similarity Threshold**: 0.7

### Performance Requirements
- Exam generation: < 30 seconds for 10 questions
- Exam loading: < 2 seconds
- Answer submission: < 1 second
- Progress calculation: Real-time (no lag)

## Edge Cases

### 1. Empty Answers
- **Issue**: User doesn't answer all questions
- **Solution**: Skip empty answers, don't count towards score
- **Implementation**: Filter out empty/whitespace answers before processing

### 2. No Notes Available
- **Issue**: Subject has no uploaded notes
- **Solution**: Show error message, disable exam generation
- **Implementation**: Check note count before allowing generation

### 3. Progress Calculation
- **Issue**: Division by zero when totalQuestions = 0
- **Solution**: Return 0% progress as fallback
- **Implementation**: `progress = totalQuestions > 0 ? (answered / total) * 100 : 0`

### 4. Concurrent Submissions
- **Issue**: User submits exam multiple times
- **Solution**: Disable submit button after first submission
- **Implementation**: Set loading state, prevent duplicate requests

## Success Metrics
- Exam generation success rate: > 95%
- Average exam completion time: 10-15 minutes
- User satisfaction with question quality: > 4/5
- System uptime: > 99%

## Future Enhancements
- Timed exams with countdown
- Question randomization
- Partial credit for multiple correct answers
- Exam templates and question banks
- Performance analytics and insights
