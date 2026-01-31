# Task 8: UI Components & Pages - Implementation Guide

## Overview
สร้าง UI Components และหน้าต่างๆ สำหรับ Exomos โดยใช้ Modern Bento Grid Design ที่สอดคล้องกับ design system ที่มีอยู่แล้ว

## Design System (Already Established)
- **Font**: IBM Plex Sans Thai
- **Style**: Modern Bento Grid with glassmorphism
- **Colors**:
  - Primary: `#6366f1` (Indigo)
  - Accent: `#8b5cf6` (Purple)
  - Secondary: `#f43f5e` (Rose)
- **Components**: Bento cards with hover effects, gradients, smooth animations

## Pages to Build

### 1. Enhanced Dashboard (`app/dashboard/page.tsx`)
**Current State**: Basic dashboard with welcome message
**Enhancements Needed**:
- [ ] Subject cards grid (bento layout)
- [ ] Recent notes list (last 5 uploads)
- [ ] Recent exams list (last 5 exams)
- [ ] Performance chart (score trends)
- [ ] Quick actions (Upload Note, Create Exam, Search)

**API Calls**:
```typescript
GET /api/subjects - Get all subjects with counts
GET /api/notes?limit=5 - Get recent notes
GET /api/exams?limit=5 - Get recent exams
```

**Key Features**:
- Empty state when no subjects/notes
- Loading states
- Error handling
- Responsive grid layout

---

### 2. Subjects Page (`app/subjects/page.tsx`)
**Purpose**: Manage subjects (create, view, edit)

**Components Needed**:
- Subject grid (bento cards)
- Create subject modal/form
- Subject card with:
  - Subject name
  - Color indicator
  - Notes count
  - Exams count
  - Last activity date
  - Actions (Edit, Delete, View)

**API Calls**:
```typescript
GET /api/subjects - List all subjects
POST /api/subjects - Create new subject
  Body: { name, description?, color? }
```

**Features**:
- Color picker for subject
- Empty state with CTA
- Search/filter subjects
- Confirmation before delete

---

### 3. Notes Page (`app/notes/page.tsx`)
**Purpose**: Upload and manage PDF notes

**Components Needed**:
- File upload zone (drag & drop)
- Notes list/grid
- Note card with:
  - Title
  - Subject badge
  - File name
  - Page count
  - Chunks count
  - Upload date
  - Actions (View, Download, Delete)

**API Calls**:
```typescript
GET /api/notes?subjectId={id} - List notes (with filter)
POST /api/notes - Upload PDF
  FormData: { file, subjectId, title, description? }
```

**Upload Form Fields**:
- Subject selection (dropdown)
- Title (required)
- Description (optional)
- PDF file (drag & drop or browse)

**Features**:
- File validation (PDF only, max size)
- Upload progress indicator
- Processing status (parsing, chunking, embedding)
- Filter by subject
- Search notes by title

**Libraries to Use**:
- `react-dropzone` for file upload
- Native FormData for multipart upload

---

### 4. Exam Generation Page (`app/exams/new/page.tsx`)
**Purpose**: Configure and generate exam from notes

**Form Fields**:
1. **Subject Selection** (required)
   - Dropdown with all subjects
   - Show notes count per subject

2. **Exam Title** (required)
   - Text input
   - Example: "Midterm Exam - Chapter 1-3"

3. **Question Count** (required)
   - Number input (1-50)
   - Default: 10

4. **Difficulty Level** (required)
   - Radio buttons: Easy, Medium, Hard
   - Default: Medium

5. **Topics** (optional)
   - Multi-select or tags input
   - Example: "Photosynthesis, Cell Structure"
   - Used for RAG context filtering

6. **Question Types** (optional)
   - Checkboxes:
     - [ ] Multiple Choice
     - [ ] True/False
     - [ ] Short Answer
   - Default: All selected

**API Call**:
```typescript
POST /api/exams
Body: {
  subjectId: string
  title: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  topics?: string[]
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer')[]
}

Response: {
  examId: string
  questions: Question[]
}
```

**Features**:
- Disable submit if no notes in subject
- Show warning if notes count is low
- Loading state during generation (can take 10-30 seconds)
- Success message with "Start Exam" button
- Error handling (no context, API errors)

**Flow**:
1. Select subject → Check if notes exist
2. Fill form → Validate inputs
3. Submit → Show loading (with progress message)
4. Success → Redirect to exam page

---

### 5. Exam Taking Page (`app/exams/[id]/page.tsx`)
**Purpose**: Display and answer exam questions

**Layout**:
```
┌─────────────────────────────────────────┐
│ Header: Exam Title | Timer | Progress   │
├─────────────────────────────────────────┤
│                                         │
│  Question 1 of 10                       │
│                                         │
│  [Question Text]                        │
│                                         │
│  [ ] Option A                           │
│  [ ] Option B                           │
│  [ ] Option C                           │
│  [ ] Option D                           │
│                                         │
│  [Previous] [Next] [Submit Exam]        │
│                                         │
└─────────────────────────────────────────┘
```

**API Call**:
```typescript
GET /api/exams/[id] - Get exam with questions
```

**Question Types Rendering**:

1. **Multiple Choice**:
   - Radio buttons for options
   - Single selection

2. **True/False**:
   - Two radio buttons: True, False

3. **Short Answer**:
   - Text input or textarea
   - Character limit (optional)

**Features**:
- Save answers to local state
- Navigation between questions
- Progress indicator (3/10 answered)
- Optional timer (countdown)
- Confirmation before submit
- Prevent navigation away (unsaved changes warning)
- Auto-save to localStorage (prevent data loss)

**Submit Flow**:
1. Validate all questions answered
2. Show confirmation modal
3. Submit answers
4. Redirect to results page

---

### 6. Results Page (`app/exams/[id]/results/page.tsx`)
**Purpose**: Display exam results and explanations

**Layout**:
```
┌─────────────────────────────────────────┐
│  🎉 Exam Completed!                     │
│                                         │
│  Score: 85/100                          │
│  Correct: 17/20                         │
│  Status: ✅ Passed                      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Question 1: ✅ Correct                 │
│  [Question text]                        │
│  Your answer: A                         │
│  Correct answer: A                      │
│  Explanation: [...]                     │
│                                         │
│  Question 2: ❌ Incorrect               │
│  [Question text]                        │
│  Your answer: B                         │
│  Correct answer: C                      │
│  Explanation: [...]                     │
│                                         │
└─────────────────────────────────────────┘
```

**API Call**:
```typescript
GET /api/exams/[id] - Get exam with answers
```

**Features**:
- Score visualization (circular progress)
- Pass/Fail indicator (60% threshold)
- Question-by-question review
- Color coding (green=correct, red=incorrect)
- Explanations for each question
- Performance insights
- Actions: Retake Exam, Back to Dashboard

**Performance Insights**:
- Difficulty breakdown (Easy: 5/5, Medium: 8/10, Hard: 4/5)
- Question type breakdown
- Time spent (if tracked)
- Comparison with previous attempts

---

### 7. Search Page (`app/search/page.tsx`)
**Purpose**: Semantic search across all notes

**Layout**:
```
┌─────────────────────────────────────────┐
│  🔍 Search Your Notes                   │
│                                         │
│  [Search input with icon]               │
│  [Subject filter dropdown]              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📄 Result 1 (Similarity: 0.92)         │
│  From: Biology Notes - Chapter 3        │
│  Page: 5                                │
│  [Content preview...]                   │
│                                         │
│  📄 Result 2 (Similarity: 0.87)         │
│  From: Biology Notes - Chapter 1        │
│  Page: 12                               │
│  [Content preview...]                   │
│                                         │
└─────────────────────────────────────────┘
```

**API Call**:
```typescript
POST /api/search
Body: {
  query: string
  subjectId?: string
  limit?: number
}

Response: {
  results: [{
    chunkId: string
    content: string
    pageNumber: number
    similarity: number
    note: {
      id: string
      title: string
      fileName: string
    }
  }]
}
```

**Features**:
- Real-time search (debounced)
- Filter by subject
- Similarity score display
- Highlight matching terms
- Click to view full note
- Empty state (no results)
- Loading state during search

---

## Shared Components to Create

### 1. `components/SubjectBadge.tsx`
```typescript
interface SubjectBadgeProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}
```
- Colored badge with subject name
- Used across multiple pages

### 2. `components/BentoCard.tsx`
```typescript
interface BentoCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}
```
- Reusable bento card component
- Consistent styling across app

### 3. `components/LoadingSpinner.tsx`
- Animated loading indicator
- Used during API calls

### 4. `components/EmptyState.tsx`
```typescript
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}
```
- Consistent empty states
- With optional CTA button

### 5. `components/FileUpload.tsx`
```typescript
interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
}
```
- Drag & drop file upload
- Using react-dropzone

### 6. `components/ProgressBar.tsx`
```typescript
interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
}
```
- Progress indicator
- Used in exam taking

### 7. `components/ScoreCircle.tsx`
```typescript
interface ScoreCircleProps {
  score: number
  size?: number
}
```
- Circular score visualization
- Used in results page

---

## State Management

### Option 1: React Context (Recommended for now)
```typescript
// contexts/AppContext.tsx
interface AppContextType {
  subjects: Subject[]
  notes: Note[]
  exams: Exam[]
  refreshSubjects: () => Promise<void>
  refreshNotes: () => Promise<void>
  refreshExams: () => Promise<void>
}
```

### Option 2: Zustand (If state becomes complex)
```typescript
// store/useStore.ts
interface AppState {
  subjects: Subject[]
  notes: Note[]
  exams: Exam[]
  setSubjects: (subjects: Subject[]) => void
  // ...
}
```

---

## Error Handling Pattern

```typescript
try {
  const response = await fetch('/api/...')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  // Success handling
} catch (error) {
  console.error(error)
  // Show toast notification
  toast.error(error.message)
}
```

---

## Loading States Pattern

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    // API call
  } finally {
    setIsLoading(false)
  }
}

return (
  <button disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Submit'}
  </button>
)
```

---

## Responsive Design

All pages should be responsive:
- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid
- **Desktop**: 3-4 column grid

Use Tailwind breakpoints:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Accessibility

- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Screen reader support
- [ ] Color contrast (WCAG AA)

---

## Dependencies to Install

```bash
bun add react-dropzone
bun add sonner  # For toast notifications
bun add recharts  # For charts (optional)
```

---

## Implementation Order (Recommended)

1. **Shared Components** (BentoCard, LoadingSpinner, EmptyState)
2. **Dashboard Enhancement** (Quick win, shows progress)
3. **Subjects Page** (Foundation for other pages)
4. **Notes Page** (Core functionality)
5. **Exam Generation Page** (Depends on subjects & notes)
6. **Exam Taking Page** (Main feature)
7. **Results Page** (Completes exam flow)
8. **Search Page** (Nice-to-have feature)

---

## Testing Checklist

For each page:
- [ ] Loading states work
- [ ] Error states display correctly
- [ ] Empty states show appropriate message
- [ ] Forms validate inputs
- [ ] API calls handle errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] No console errors

---

## Next Steps

1. Choose which page to start with
2. Create shared components first
3. Build pages incrementally
4. Test with real data
5. Refine UI/UX based on testing

พร้อมเริ่มสร้างหน้าไหนก่อนครับ? แนะนำเริ่มจาก **Shared Components** แล้วค่อยทำ **Dashboard** หรือ **Subjects Page** ก่อน
