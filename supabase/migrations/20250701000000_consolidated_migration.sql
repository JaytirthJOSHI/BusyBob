DROP TABLE IF EXISTS "public"."profiles" CASCADE;
DROP TABLE IF EXISTS "public"."points_transactions" CASCADE;
DROP TABLE IF EXISTS "public"."pomodoro_sessions" CASCADE;
DROP TABLE IF EXISTS "public"."canvas_credentials" CASCADE;
DROP TABLE IF EXISTS "public"."studentvue_credentials" CASCADE;
DROP TABLE IF EXISTS "public"."music_connections" CASCADE;
DROP TABLE IF EXISTS "public"."kid_mode_settings" CASCADE;
DROP TABLE IF EXISTS "public"."ai_notes" CASCADE;
DROP TABLE IF EXISTS "public"."journal_entries" CASCADE;
DROP TABLE IF EXISTS "public"."feelings" CASCADE;
DROP TABLE IF EXISTS "public"."tasks" CASCADE;

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "email" "text",
    "avatar_url" "text",
    "last_login" timestamp with time zone,
    "settings" "jsonb",
    "points" integer DEFAULT 0
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

CREATE TABLE IF NOT EXISTS "public"."studentvue_credentials" (
    "user_id" "uuid" NOT NULL,
    "district_url" "text" NOT NULL,
    "username" "text" NOT NULL,
    "password" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."canvas_credentials" (
    "user_id" "uuid" NOT NULL,
    "canvas_url" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."pomodoro_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_minutes" integer NOT NULL,
    "session_type" "text" DEFAULT 'pomodoro'::"text",
    "completed" boolean DEFAULT false,
    "task_id" "uuid"
);

CREATE TABLE IF NOT EXISTS "public"."points_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "points" integer NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "related_item_id" "uuid",
    "related_table" "text"
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE "public"."tasks" OWNER TO "postgres";
ALTER TABLE "public"."feelings" OWNER TO "postgres";
ALTER TABLE "public"."journal_entries" OWNER TO "postgres";
ALTER TABLE "public"."ai_notes" OWNER TO "postgres";
ALTER TABLE "public"."kid_mode_settings" OWNER TO "postgres";
ALTER TABLE "public"."music_connections" OWNER TO "postgres";
ALTER TABLE "public"."studentvue_credentials" OWNER TO "postgres";
ALTER TABLE "public"."canvas_credentials" OWNER TO "postgres";
ALTER TABLE "public"."pomodoro_sessions" OWNER TO "postgres";
ALTER TABLE "public"."points_transactions" OWNER TO "postgres";

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
ALTER TABLE ONLY "public"."studentvue_credentials" ADD CONSTRAINT "studentvue_credentials_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."studentvue_credentials" ADD CONSTRAINT "studentvue_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."canvas_credentials" ADD CONSTRAINT "canvas_credentials_pkey" PRIMARY KEY ("user_id");
ALTER TABLE ONLY "public"."canvas_credentials" ADD CONSTRAINT "canvas_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."points_transactions" ADD CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."points_transactions" ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studentvue_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view their own data" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));
CREATE POLICY "Allow authenticated users to update their own data" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));
CREATE POLICY "Allow authenticated users to access their own tasks" ON "public"."tasks" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own feelings" ON "public"."feelings" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own journal entries" ON "public"."journal_entries" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own AI notes" ON "public"."ai_notes" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own kid mode settings" ON "public"."kid_mode_settings" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own music connections" ON "public"."music_connections" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own studentvue credentials" ON "public"."studentvue_credentials" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own canvas credentials" ON "public"."canvas_credentials" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own pomodoro sessions" ON "public"."pomodoro_sessions" FOR ALL USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Allow authenticated users to access their own points transactions" ON "public"."points_transactions" FOR ALL USING (("auth"."uid"() = "user_id"));