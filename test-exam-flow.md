# Manual Test Report: Exam Generation & Taking System

## Test Date: 2025-02-01
## Tester: Claude AI Assistant

---

## Test Cases Summary

### TC009: Generate Exam Successfully ✅
**Priority:** High
**Status:** Ready to Test

**Steps:**
1. Login to the application
2. Navigate to a subject with uploaded notes
3. Click "Generate Exam" button
4. Configure parameters:
   - Number of questions: 10
   - Difficulty: medium
5. Click "Generate"

**Expected Results:**
- Exam generation completes within 30 seconds
- 10 questions are generated
- Questions have multiple choice options
- Correct answers and explanations are stored

**API Endpoint:** `POST /api/exams/generate`

---

### TC011: Load Exam Within Performance Limits ✅
**Priority:** High
**Status:** Ready to Test

**Steps:**
1. Navigate to `/exams/[id]` page
2. Measure page load time

**Expected Results:**
- Exam loads within 2 seconds
- All questions render correctly
- Progress bar initializes at 0%

**Performance Requirement:** < 2 seconds

---

### TC012: Real-Time Progress Tracking ✅
**Priority:** High
**Status:** Ready to Test

**Steps:**
1. Start taking an exam
2. Answer questions one by one
3. Observe progress updates

**Expected Results:**
- Progress updates immediately after each answer
- Progress calculation: `(answeredCount / totalQuestions) * 100`
- Progress bar shows correct percentage
- No NaN% errors

**Implementation Check:**
```typescript
const answeredCount = Object.values(answers).filter(
  answer => answer && answer.trim() !== ''
).length
const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
```

---

### TC013: Answer Submission Response Time ✅
**Priority:** High
**Status:** Ready to Test

**Steps:**
1. Answer a question
2. Click submit or move to next question
3. Measure response time

**Expected Results:**
- Response within 1 second
- Answer saved to state
- Progress updates immediately

**Performance Requirement:** < 1 second

---

### TC014: Handle Empty Answers Gracefully ✅
**Priority:** High
**Status:** Ready to Test

**Steps:**
1. Start an exam
2. Skip some questions (leave empty)
3. Answer other questions
4. Submit exam

**Expected Results:**
- Empty answers are skipped in scoring
- No errors thrown
- Score calculated only for answered questions
- Progress shows only answered questions

**Implementation Check:**
```typescript
// In exam-generator.ts
if (!answer.answer || answer.answer.trim() === '') continue
```

---

## Test Execution Checklist

### Prerequisites
- [ ] Application running on http://localhost:3000
- [ ] User authenticated
- [ ] At least one subject created
- [ ] At least one PDF note uploaded and processed
- [ ] Database accessible

### Test Environment
- **Framework:** Next.js 16 + React 19
- **Database:** PostgreSQL with pgvector
- **AI Model:** Google Gemini 1.5 Flash
- **Embeddings:** text-embedding-004 (768d)

### Manual Testing Steps

#### 1. Test Exam Generation (TC009)
```bash
# Open browser console and run:
const response = await fetch('/api/exams/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjectId: 'YOUR_SUBJECT_ID',
    numQuestions: 10,
    difficulty: 'medium'
  })
})
const data = await response.json()
console.log('Exam generated:', data)
```

#### 2. Test Exam Loading (TC011)
```bash
# Measure load time
performance.mark('start')
// Navigate to /exams/[id]
performance.mark('end')
performance.measure('exam-load', 'start', 'end')
console.log(performance.getEntriesByName('exam-load')[0].duration)
```

#### 3. Test Progress Tracking (TC012)
- Open exam page
- Open React DevTools
- Watch `answers` state and `progress` value
- Answer questions and verify updates

#### 4. Test Answer Submission (TC013)
```bash
# In browser console
performance.mark('submit-start')
// Click answer option
performance.mark('submit-end')
performance.measure('submit', 'submit-start', 'submit-end')
console.log(performance.getEntriesByName('submit')[0].duration)
```

#### 5. Test Empty Answers (TC014)
- Start exam
- Skip questions 1, 3, 5
- Answer questions 2, 4, 6-10
- Submit exam
- Verify score = 7/10 (not 7/7)
- Check progress shows "7/10 70%"

---

## Known Issues Fixed

### Issue 1: NaN% Progress ✅ FIXED
**Problem:** Progress showed "7/10 NaN%"
**Root Cause:** Division by zero when totalQuestions = 0
**Fix:** Added fallback `totalQuestions > 0 ? ... : 0`

### Issue 2: Empty Answer Errors ✅ FIXED
**Problem:** `Cannot read properties of undefined (reading 'trim')`
**Root Cause:** Some questions had no answers
**Fix:** Added check `if (!answer.answer || answer.answer.trim() === '') continue`

### Issue 3: Schema Mismatches ✅ FIXED
**Problem:** Invalid Prisma invocations
**Fixes:**
- Added `difficulty`, `totalQuestions`, `status` to Exam model
- Changed `question` → `questionText`, `order` → `orderIndex`
- Changed `userAnswer` → `selectedAnswer` in Answer model

---

## Test Results (To Be Filled)

| Test ID | Test Name | Status | Duration | Notes |
|---------|-----------|--------|----------|-------|
| TC009 | Generate Exam | ⏳ Pending | - | - |
| TC011 | Load Exam | ⏳ Pending | - | - |
| TC012 | Progress Tracking | ⏳ Pending | - | - |
| TC013 | Answer Submission | ⏳ Pending | - | - |
| TC014 | Empty Answers | ⏳ Pending | - | - |

---

## Recommendations

1. **Performance Monitoring:**
   - Add performance.mark() calls in production
   - Track exam generation time
   - Monitor answer submission latency

2. **Error Handling:**
   - Add retry logic for failed exam generation
   - Show user-friendly error messages
   - Log errors to monitoring service

3. **User Experience:**
   - Add loading states during exam generation
   - Show progress indicator during generation
   - Add confirmation before submitting exam

4. **Testing:**
   - Add automated E2E tests with Playwright
   - Add unit tests for exam-generator.ts
   - Add integration tests for API routes

---

## Next Steps

1. Run manual tests following the checklist above
2. Fill in test results table
3. Document any bugs found
4. Create GitHub issues for bugs
5. Implement automated tests
