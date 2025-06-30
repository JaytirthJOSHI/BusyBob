/*
  # Database Schema Setup for Mindful Student App

  1. New Tables
    - `users` - User profiles linked to auth.users
    - `tasks` - Task management with calendar support
    - `feelings` - Mood tracking with ratings and tags
    - `journal_entries` - Personal journal entries

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data

  3. Performance
    - Add indexes for frequently queried columns
*/

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  -- Drop existing policies for users table
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own data" ON users;
  DROP POLICY IF EXISTS "Users can read own data" ON users;

  -- Drop existing policies for tasks table
  DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

  -- Drop existing policies for feelings table
  DROP POLICY IF EXISTS "Users can read own feelings" ON feelings;
  DROP POLICY IF EXISTS "Users can insert own feelings" ON feelings;
  DROP POLICY IF EXISTS "Users can delete own feelings" ON feelings;

  -- Drop existing policies for journal_entries table
  DROP POLICY IF EXISTS "Users can read own journal entries" ON journal_entries;
  DROP POLICY IF EXISTS "Users can insert own journal entries" ON journal_entries;
  DROP POLICY IF EXISTS "Users can update own journal entries" ON journal_entries;
  DROP POLICY IF EXISTS "Users can delete own journal entries" ON journal_entries;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Create or update users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE,
      name text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email' AND table_schema = 'public') THEN
      ALTER TABLE users ADD COLUMN email text UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at' AND table_schema = 'public') THEN
      ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END $$;

-- Create or update tasks table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
    CREATE TABLE tasks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text DEFAULT '',
      due_date date NOT NULL,
      due_time time NOT NULL,
      stress_level integer CHECK (stress_level >= 1 AND stress_level <= 5) NOT NULL,
      completed boolean DEFAULT false,
      priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      category text DEFAULT 'general',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'title' AND table_schema = 'public') THEN
      ALTER TABLE tasks ADD COLUMN title text;
      UPDATE tasks SET title = name WHERE title IS NULL;
      ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority' AND table_schema = 'public') THEN
      ALTER TABLE tasks ADD COLUMN priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'category' AND table_schema = 'public') THEN
      ALTER TABLE tasks ADD COLUMN category text DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at' AND table_schema = 'public') THEN
      ALTER TABLE tasks ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END $$;

-- Create or update feelings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feelings' AND table_schema = 'public') THEN
    CREATE TABLE feelings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      mood_tags text[] DEFAULT '{}',
      comments text DEFAULT '',
      created_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feelings' AND column_name = 'mood_tags' AND table_schema = 'public') THEN
      ALTER TABLE feelings ADD COLUMN mood_tags text[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Create or update journal_entries table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries' AND table_schema = 'public') THEN
    CREATE TABLE journal_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      title text DEFAULT '',
      content text NOT NULL,
      mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
      tags text[] DEFAULT '{}',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'title' AND table_schema = 'public') THEN
      ALTER TABLE journal_entries ADD COLUMN title text DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'mood_rating' AND table_schema = 'public') THEN
      ALTER TABLE journal_entries ADD COLUMN mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'tags' AND table_schema = 'public') THEN
      ALTER TABLE journal_entries ADD COLUMN tags text[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'updated_at' AND table_schema = 'public') THEN
      ALTER TABLE journal_entries ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create new policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create new policies for tasks table
CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create new policies for feelings table
CREATE POLICY "Users can read own feelings"
  ON feelings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feelings"
  ON feelings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own feelings"
  ON feelings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create new policies for journal_entries table
CREATE POLICY "Users can read own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_feelings_user_id ON feelings(user_id);
CREATE INDEX IF NOT EXISTS idx_feelings_created_at ON feelings(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_journal_entries_updated_at') THEN
    CREATE TRIGGER update_journal_entries_updated_at
      BEFORE UPDATE ON journal_entries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;