# Database Setup Guide

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **pgvector Extension**: Enabled in Supabase (usually enabled by default)

## Setup Steps

### 1. Get Database URL from Supabase

1. Go to your Supabase project
2. Navigate to **Settings** → **Database**
3. Copy the **Connection String** (URI format)
4. Add it to `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Enable pgvector Extension

Run this SQL in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Generate Prisma Client

```bash
bun run db:generate
```

### 4. Push Schema to Database

```bash
bun run db:push
```

Or create a migration:

```bash
bun run db:migrate
```

### 5. (Optional) Seed Database

```bash
bun run db:seed
```

## Database Schema Overview

### Tables

1. **users** - User accounts (synced with Supabase Auth)
2. **subjects** - Study subjects (Physics, Chemistry, etc.)
3. **notes** - Uploaded PDF/image files
4. **note_chunks** - Text chunks with vector embeddings (768-dim for Gemini)
5. **exams** - Generated exams
6. **questions** - Exam questions with source grounding
7. **answers** - User answers
8. **performances** - Analytics data

### Key Features

- **Vector Search**: Uses pgvector for semantic search (768-dimensional embeddings)
- **Cascade Deletes**: Automatic cleanup when parent records are deleted
- **Indexes**: Optimized for common queries
- **Grounding**: Questions linked to source chunks for transparency

## Useful Commands

```bash
# Generate Prisma Client
bun run db:generate

# Push schema changes (no migration files)
bun run db:push

# Create migration
bun run db:migrate

# Run seed
bun run db:seed

# Open Prisma Studio (GUI)
bun run db:studio
```

## Notes

- **User Management**: Users are managed by Supabase Auth, but we maintain a `users` table for relations
- **Vector Dimension**: Using 768 dimensions for Gemini embeddings
- **File Storage**: File URLs point to Cloudflare R2
- **RLS**: Row Level Security should be configured in Supabase for additional security

## Troubleshooting

### Error: "relation does not exist"
Run `bun run db:push` to create tables

### Error: "type vector does not exist"
Enable pgvector extension in Supabase SQL Editor

### Error: "Cannot find module '@/lib/generated/prisma'"
Run `bun run db:generate` to generate Prisma Client
