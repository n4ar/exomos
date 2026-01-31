-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table (will sync with Supabase Auth)
-- Note: This is just for reference, actual user management is in Supabase Auth
