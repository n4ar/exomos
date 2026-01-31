# RAG Pipeline Documentation

## Overview

Exomos ใช้ **Strict RAG (Retrieval-Augmented Generation)** pipeline เพื่อสร้างข้อสอบจากบันทึกของนักเรียน โดยใช้เฉพาะข้อมูลจากบันทึกที่อัปโหลดเท่านั้น ไม่ใช้ความรู้ภายนอกจาก LLM

## Architecture

```
PDF Upload → Parse → Chunk → Embed → Store → Search → Generate Exam
```

### 1. File Storage (Cloudflare R2)
- **Library**: `@aws-sdk/client-s3` (S3-compatible)
- **Location**: `lib/r2.ts`
- **Features**:
  - Upload PDF files to R2
  - Generate presigned URLs
  - Delete files
  - Automatic file key generation

### 2. PDF Parsing
- **Library**: `pdf-parse` v2.4.5
- **Location**: `lib/pdf-parser.ts`
- **Features**:
  - Extract text from PDF
  - Parse by pages
  - Text chunking with overlap
  - Text cleaning and normalization

### 3. Text Chunking
- **Strategy**: Sliding window with overlap
- **Default Settings**:
  - Chunk size: 1000 characters
  - Overlap: 200 characters
- **Benefits**:
  - Preserves context across chunks
  - Better semantic search results

### 4. Embeddings Generation
- **Model**: `text-embedding-004` (Gemini)
- **Dimensions**: 768
- **Library**: `@google/generative-ai`
- **Location**: `lib/embeddings.ts`
- **Features**:
  - Single text embedding
  - Batch embeddings
  - Cosine similarity calculation

### 5. Vector Storage
- **Database**: PostgreSQL with pgvector extension
- **Vector Type**: `vector(768)`
- **Index**: Cosine similarity (`<=>` operator)
- **Location**: Prisma schema

### 6. Semantic Search
- **Method**: Vector similarity search
- **Location**: `lib/rag-pipeline.ts`
- **Query**:
  ```sql
  SELECT * FROM note_chunks
  ORDER BY embedding <=> query_embedding
  LIMIT 5
  ```

### 7. Exam Generation
- **Model**: `gemini-2.5-flash`
- **Location**: `lib/exam-generator.ts`
- **Strategy**: Strict RAG
  - Only use content from user's notes
  - No external knowledge
  - Clear citations in explanations

## API Endpoints

### Notes
- `POST /api/notes` - Upload and process PDF note
- `GET /api/notes` - Get user's notes

### Subjects
- `POST /api/subjects` - Create subject
- `GET /api/subjects` - Get user's subjects

### Exams
- `POST /api/exams` - Generate exam from notes
- `GET /api/exams` - Get user's exams
- `GET /api/exams/[id]` - Get exam details
- `POST /api/exams/[id]/submit` - Submit exam answers

### Search
- `POST /api/search` - Vector similarity search

## Usage Example

### 1. Upload Note
```typescript
const formData = new FormData()
formData.append('file', pdfFile)
formData.append('subjectId', 'subject-uuid')
formData.append('title', 'Chapter 1: Introduction')
formData.append('description', 'Basic concepts')

const response = await fetch('/api/notes', {
  method: 'POST',
  body: formData,
})

const { data } = await response.json()
// { noteId, chunksCreated, fileUrl }
```

### 2. Generate Exam
```typescript
const response = await fetch('/api/exams', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjectId: 'subject-uuid',
    title: 'Midterm Exam',
    questionCount: 10,
    difficulty: 'medium',
    topics: ['Introduction', 'Basic Concepts'],
    questionTypes: ['multiple_choice', 'true_false'],
  }),
})

const { data } = await response.json()
// { examId, questions }
```

### 3. Submit Exam
```typescript
const response = await fetch(`/api/exams/${examId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: [
      { questionId: 'q1', answer: 'A' },
      { questionId: 'q2', answer: 'True' },
    ],
  }),
})

const { data } = await response.json()
// { score, correctCount, totalQuestions, passed }
```

### 4. Search Notes
```typescript
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is photosynthesis?',
    subjectId: 'subject-uuid',
    limit: 5,
  }),
})

const { data } = await response.json()
// [{ chunkId, content, pageNumber, similarity, note }]
```

## Environment Variables

```env
# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=exomos-files

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Database (already configured)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## Performance Considerations

### Chunking Strategy
- **Small chunks (500-800 chars)**: Better precision, more chunks
- **Large chunks (1500-2000 chars)**: Better context, fewer chunks
- **Current (1000 chars)**: Balanced approach

### Embedding Batch Size
- Process embeddings in batches to avoid rate limits
- Current: Sequential processing (can be optimized)

### Vector Search
- Use cosine similarity for normalized vectors
- Consider adding metadata filters (subject, date, etc.)
- Index on `embedding` column for faster search

### Caching
- Cache frequently accessed embeddings
- Cache exam templates
- Use Redis for session storage (future enhancement)

## Strict RAG Implementation

### Principles
1. **Only use provided context**: Never generate information not in notes
2. **Clear citations**: Always reference source material
3. **Acknowledge limitations**: If context insufficient, say so
4. **Factual accuracy**: Verify all facts against source

### Prompt Engineering
```
คุณเป็นผู้สร้างข้อสอบที่เชี่ยวชาญ กรุณาสร้างข้อสอบจากเนื้อหาที่ให้มาเท่านั้น

**กฎสำคัญ:**
- ใช้เฉพาะข้อมูลจากเนื้อหาที่ให้มาเท่านั้น ห้ามใช้ความรู้ภายนอก
- ถ้าเนื้อหาไม่เพียงพอ ให้สร้างข้อสอบน้อยลงตามความเหมาะสม
- คำถามต้องชัดเจน ตรงประเด็น และมีคำตอบที่แน่นอน
```

## Future Enhancements

1. **Hybrid Search**: Combine vector search with keyword search
2. **Re-ranking**: Use cross-encoder for better result ordering
3. **Query Expansion**: Expand user queries for better recall
4. **Feedback Loop**: Learn from user corrections
5. **Multi-modal**: Support images, diagrams in PDFs
6. **Incremental Updates**: Update embeddings without full reprocessing

## Troubleshooting

### Issue: Low similarity scores
- **Solution**: Adjust chunk size or overlap
- **Check**: Query phrasing and embedding quality

### Issue: Slow processing
- **Solution**: Implement batch processing
- **Check**: Database indexes and connection pooling

### Issue: Out of context answers
- **Solution**: Strengthen RAG prompt constraints
- **Check**: Context window size and relevance threshold

### Issue: PDF parsing errors
- **Solution**: Validate PDF format and encoding
- **Check**: pdf-parse version compatibility

## References

- [Gemini Embeddings API](https://ai.google.dev/gemini-api/docs/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [AWS S3 SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [pdf-parse](https://github.com/mehmet-kozan/pdf-parse)
