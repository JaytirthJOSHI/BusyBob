-- Add gamification system tables

-- Points transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Pomodoro sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('work', 'shortBreak', 'longBreak')),
    duration INTEGER NOT NULL, -- in minutes
    completed BOOLEAN DEFAULT true,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add gamification columns to user_metadata table
ALTER TABLE user_metadata 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rank INTEGER,
ADD COLUMN IF NOT EXISTS unlocked_rewards TEXT[],
ADD COLUMN IF NOT EXISTS pomodoro_settings JSONB DEFAULT '{
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "sessionsUntilLongBreak": 4,
    "autoStartBreaks": false,
    "autoStartWork": false,
    "soundEnabled": true
}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_created_at ON pomodoro_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_type ON pomodoro_sessions(session_type);

-- RLS policies for points_transactions
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points transactions" ON points_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for pomodoro_sessions
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pomodoro sessions" ON pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions" ON pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro sessions" ON pomodoro_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate user rank based on points
CREATE OR REPLACE FUNCTION calculate_user_rank(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO user_rank
    FROM user_metadata
    WHERE points > (
        SELECT COALESCE(points, 0) 
        FROM user_metadata 
        WHERE user_id = target_user_id
    );
    
    RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user rank (call this periodically or on point changes)
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void AS $$
BEGIN
    UPDATE user_metadata 
    SET rank = calculate_user_rank(user_id)
    WHERE points IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award achievement
CREATE OR REPLACE FUNCTION award_achievement(
    target_user_id UUID,
    achievement_id TEXT,
    achievement_name TEXT,
    achievement_description TEXT DEFAULT '',
    achievement_icon TEXT DEFAULT '🏆'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_achievements (user_id, achievement_id, name, description, icon)
    VALUES (target_user_id, achievement_id, achievement_name, achievement_description, achievement_icon)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award streak achievements
CREATE OR REPLACE FUNCTION check_streak_achievements(target_user_id UUID)
RETURNS void AS $$
DECLARE
    current_streak INTEGER;
    task_count INTEGER;
BEGIN
    -- Calculate current daily streak (simplified logic)
    SELECT COUNT(DISTINCT DATE(created_at)) INTO current_streak
    FROM tasks 
    WHERE user_id = target_user_id 
      AND completed = true 
      AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Award streak achievements
    IF current_streak >= 7 THEN
        PERFORM award_achievement(target_user_id, 'week_streak', 'Week Warrior', 'Complete tasks for 7 days in a row', '🗓️');
    END IF;
    
    IF current_streak >= 30 THEN
        PERFORM award_achievement(target_user_id, 'month_streak', 'Monthly Master', 'Complete tasks for 30 days in a row', '📅');
    END IF;
    
    -- Check first task achievement
    SELECT COUNT(*) INTO task_count FROM tasks WHERE user_id = target_user_id AND completed = true;
    IF task_count >= 1 THEN
        PERFORM award_achievement(target_user_id, 'first_task', 'Getting Started', 'Complete your first task', '🎯');
    END IF;
    
    -- Check early bird achievement (tasks completed before 9 AM)
    SELECT COUNT(*) INTO task_count 
    FROM tasks 
    WHERE user_id = target_user_id 
      AND completed = true 
      AND EXTRACT(HOUR FROM completed_at) < 9;
      
    IF task_count >= 10 THEN
        PERFORM award_achievement(target_user_id, 'early_bird', 'Early Bird', 'Complete 10 tasks before 9 AM', '🐦');
    END IF;
    
    -- Check night owl achievement (tasks completed after 9 PM)
    SELECT COUNT(*) INTO task_count 
    FROM tasks 
    WHERE user_id = target_user_id 
      AND completed = true 
      AND EXTRACT(HOUR FROM completed_at) >= 21;
      
    IF task_count >= 10 THEN
        PERFORM award_achievement(target_user_id, 'night_owl', 'Night Owl', 'Complete 10 tasks after 9 PM', '🦉');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check Pomodoro achievements
CREATE OR REPLACE FUNCTION check_pomodoro_achievements(target_user_id UUID)
RETURNS void AS $$
DECLARE
    session_count INTEGER;
BEGIN
    -- Check total work sessions
    SELECT COUNT(*) INTO session_count 
    FROM pomodoro_sessions 
    WHERE user_id = target_user_id 
      AND session_type = 'work' 
      AND completed = true;
    
    IF session_count >= 1 THEN
        PERFORM award_achievement(target_user_id, 'first_pomodoro', 'Focus Beginner', 'Complete your first Pomodoro session', '🍅');
    END IF;
    
    IF session_count >= 25 THEN
        PERFORM award_achievement(target_user_id, 'pomodoro_veteran', 'Focus Veteran', 'Complete 25 Pomodoro sessions', '🍅');
    END IF;
    
    IF session_count >= 100 THEN
        PERFORM award_achievement(target_user_id, 'pomodoro_pro', 'Pomodoro Pro', 'Complete 100 focus sessions', '🍅');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check mood tracking achievements  
CREATE OR REPLACE FUNCTION check_mood_achievements(target_user_id UUID)
RETURNS void AS $$
DECLARE
    mood_count INTEGER;
    streak_days INTEGER;
BEGIN
    -- Check total mood entries
    SELECT COUNT(*) INTO mood_count 
    FROM feelings 
    WHERE user_id = target_user_id;
    
    IF mood_count >= 1 THEN
        PERFORM award_achievement(target_user_id, 'first_mood', 'Mood Tracker', 'Log your first mood entry', '😊');
    END IF;
    
    -- Check consistent mood logging (simplified - count unique days)
    SELECT COUNT(DISTINCT DATE(created_at)) INTO streak_days
    FROM feelings 
    WHERE user_id = target_user_id 
      AND created_at >= NOW() - INTERVAL '30 days';
    
    IF streak_days >= 7 THEN
        PERFORM award_achievement(target_user_id, 'mood_week', 'Mood Week', 'Log mood for 7 different days', '😊');
    END IF;
    
    IF streak_days >= 30 THEN
        PERFORM award_achievement(target_user_id, 'mood_master', 'Mood Master', 'Log your mood for 30 days', '😊');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically check achievements when tasks are completed
CREATE OR REPLACE FUNCTION trigger_check_achievements()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
        PERFORM check_streak_achievements(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_task_completion
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements();

-- Trigger to check Pomodoro achievements
CREATE OR REPLACE FUNCTION trigger_check_pomodoro_achievements()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM check_pomodoro_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pomodoro_achievements_on_session
    AFTER INSERT ON pomodoro_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_pomodoro_achievements();

-- Trigger to check mood achievements
CREATE OR REPLACE FUNCTION trigger_check_mood_achievements()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM check_mood_achievements(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_mood_achievements_on_feeling
    AFTER INSERT ON feelings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_mood_achievements();

-- Insert some sample achievements data (optional)
COMMENT ON TABLE points_transactions IS 'Tracks all point-earning activities for gamification';
COMMENT ON TABLE user_achievements IS 'Stores unlocked achievements for each user';
COMMENT ON TABLE pomodoro_sessions IS 'Tracks Pomodoro timer sessions and their outcomes';

-- Grant necessary permissions
GRANT ALL ON points_transactions TO authenticated;
GRANT ALL ON user_achievements TO authenticated;  
GRANT ALL ON pomodoro_sessions TO authenticated; 