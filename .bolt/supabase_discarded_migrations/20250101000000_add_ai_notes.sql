/*
  # AI Notes Feature

  1. New Tables
    - `ai_notes` - AI-powered notes from document uploads and audio recordings
    - `ai_note_files` - File attachments and metadata for AI notes

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own AI notes
    - Link notes to auth.uid()

  3. Features
    - Document upload processing
    - Audio recording transcription
    - AI-generated summaries
    - File attachment storage
    - Full-text search capabilities
*/

-- Create ai_notes table
CREATE TABLE IF NOT EXISTS ai_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  ai_summary text,
  transcript text,
  note_type text CHECK (note_type IN ('upload', 'recording', 'manual')) NOT NULL,
  source_file_name text,
  source_file_type text,
  source_file_size bigint,
  audio_duration integer, -- in seconds
  processing_status text CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'completed',
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_note_files table for file attachments
CREATE TABLE IF NOT EXISTS ai_note_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_note_id uuid REFERENCES ai_notes(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_bucket text DEFAULT 'ai-notes',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_note_files ENABLE ROW LEVEL SECURITY;

-- AI Notes policies
CREATE POLICY "Users can read own ai notes"
  ON ai_notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai notes"
  ON ai_notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai notes"
  ON ai_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai notes"
  ON ai_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- AI Note Files policies
CREATE POLICY "Users can read own ai note files"
  ON ai_note_files FOR SELECT
  TO authenticated
  USING (
    ai_note_id IN (
      SELECT id FROM ai_notes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ai note files"
  ON ai_note_files FOR INSERT
  TO authenticated
  WITH CHECK (
    ai_note_id IN (
      SELECT id FROM ai_notes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own ai note files"
  ON ai_note_files FOR UPDATE
  TO authenticated
  USING (
    ai_note_id IN (
      SELECT id FROM ai_notes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own ai note files"
  ON ai_note_files FOR DELETE
  TO authenticated
  USING (
    ai_note_id IN (
      SELECT id FROM ai_notes WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_notes_user_id ON ai_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_notes_created_at ON ai_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_notes_type ON ai_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_ai_notes_status ON ai_notes(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_note_files_note_id ON ai_note_files(ai_note_id);

-- Create full-text search index for content
CREATE INDEX IF NOT EXISTS idx_ai_notes_content_search ON ai_notes USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_ai_notes_title_search ON ai_notes USING gin(to_tsvector('english', title));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_notes_updated_at
    BEFORE UPDATE ON ai_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Add function for full-text search
CREATE OR REPLACE FUNCTION search_ai_notes(
  search_query text,
  user_uuid uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  ai_summary text,
  note_type text,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.content,
    n.ai_summary,
    n.note_type,
    n.created_at,
    ts_rank(
      to_tsvector('english', n.title || ' ' || n.content || ' ' || COALESCE(n.ai_summary, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM ai_notes n
  WHERE n.user_id = user_uuid
    AND (
      to_tsvector('english', n.title || ' ' || n.content || ' ' || COALESCE(n.ai_summary, ''))
      @@ plainto_tsquery('english', search_query)
    )
  ORDER BY rank DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;