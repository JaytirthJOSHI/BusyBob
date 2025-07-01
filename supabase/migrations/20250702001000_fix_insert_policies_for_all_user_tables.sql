-- Add INSERT policies for all user-owned tables to fix RLS 406 errors

CREATE POLICY "Allow authenticated users to insert their own task"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own feeling"
ON public.feelings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own journal entry"
ON public.journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own AI note"
ON public.ai_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own kid mode settings"
ON public.kid_mode_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own music connection"
ON public.music_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own studentvue credentials"
ON public.studentvue_credentials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own canvas credentials"
ON public.canvas_credentials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own pomodoro session"
ON public.pomodoro_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own points transaction"
ON public.points_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id); 