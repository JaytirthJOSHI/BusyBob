-- Create a table for public profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  -- Gamification
  points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  pomodoro_settings JSONB DEFAULT '{
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "sessionsUntilLongBreak": 4,
    "autoStartBreaks": false,
    "autoStartWork": false,
    "soundEnabled": true
  }'::jsonb,
  -- Kid Mode
  kid_mode_enabled BOOLEAN DEFAULT false,
  date_of_birth DATE,
  -- Music
  spotify_last_connected TIMESTAMPTZ
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Other tables from previous migrations

CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own points transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('work', 'shortBreak', 'longBreak')),
    duration INTEGER NOT NULL, -- in minutes
    completed BOOLEAN DEFAULT true,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pomodoro sessions" ON pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kid_mode_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT false,
    date_of_birth DATE,
    admin_code TEXT,
    restricted_features TEXT[],
    content_filtering_level INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE kid_mode_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own kid mode settings" ON kid_mode_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE music_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);
ALTER TABLE music_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own music connections" ON music_connections
    FOR ALL USING (auth.uid() = user_id);

-- Tables from winter_villa migration
CREATE TABLE tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text DEFAULT '',
    due_date date NOT NULL,
    due_time time,
    stress_level integer CHECK (stress_level >= 1 AND stress_level <= 5) NOT NULL,
    completed boolean DEFAULT false,
    priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category text DEFAULT 'general',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE feelings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    mood_tags text[] DEFAULT '{}',
    comments text DEFAULT '',
    dummy_col TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE feelings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own feelings" ON feelings
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text DEFAULT '',
    content text NOT NULL,
    mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journal entries" ON journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- Function and trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_feelings_updated_at BEFORE UPDATE ON feelings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "email" "text",
    "avatar_url" "text",
    "last_login" timestamp with time zone,
    "settings" "jsonb"
);

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" "date",
    "completed" boolean DEFAULT false,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."feelings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mood" "text" NOT NULL,
    "intensity" smallint,
    "notes" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."ai_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "source" "text"
);

CREATE TABLE IF NOT EXISTS "public"."kid_mode_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "is_enabled" boolean DEFAULT false,
    "pin" "text",
    "allowed_features" "jsonb"
);

CREATE TABLE IF NOT EXISTS "public"."music_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "service" "text" NOT NULL,
    "auth_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE "public"."tasks" OWNER TO "postgres";
ALTER TABLE "public"."feelings" OWNER TO "postgres";
ALTER TABLE "public"."journal_entries" OWNER TO "postgres";
ALTER TABLE "public"."ai_notes" OWNER TO "postgres";
ALTER TABLE "public"."kid_mode_settings" OWNER TO "postgres";
ALTER TABLE "public"."music_connections" OWNER TO "postgres";

ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."tasks" ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."feelings" ADD CONSTRAINT "feelings_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."feelings" ADD CONSTRAINT "feelings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."journal_entries" ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."ai_notes" ADD CONSTRAINT "ai_notes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."ai_notes" ADD CONSTRAINT "ai_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."kid_mode_settings" ADD CONSTRAINT "kid_mode_settings_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."kid_mode_settings" ADD CONSTRAINT "kid_mode_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."music_connections" ADD CONSTRAINT "music_connections_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."music_connections" ADD CONSTRAINT "music_connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view their own data" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Allow authenticated users to update their own data" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE POLICY "Allow authenticated users to access their own tasks" ON "public"."tasks" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own feelings" ON "public"."feelings" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own journal entries" ON "public"."journal_entries" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own AI notes" ON "public"."ai_notes" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own kid mode settings" ON "public"."kid_mode_settings" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own music connections" ON "public"."music_connections" FOR ALL USING (("auth"."uid"() = "user_id")); 