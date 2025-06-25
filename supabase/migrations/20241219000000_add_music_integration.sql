-- Add music integration tables
-- This migration adds tables for music service integration (Spotify, Apple Music, etc.)

-- Table for storing music service connections
CREATE TABLE IF NOT EXISTS music_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', etc.
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one connection per provider per user
    UNIQUE(user_id, provider)
);

-- Table for storing listening history
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id VARCHAR(255) NOT NULL, -- Spotify track ID or similar
    track_name TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_name TEXT,
    duration_ms INTEGER,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', etc.
    session_type VARCHAR(50), -- 'focus', 'break', 'general', etc.
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for music analytics and insights
CREATE TABLE IF NOT EXISTS music_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- 'mood_playlist_selection', 'focus_session_start', etc.
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    session_duration INTEGER, -- in minutes for focus sessions
    genre VARCHAR(100),
    energy_level DECIMAL(3,2), -- 0.00 to 1.00
    valence_level DECIMAL(3,2), -- 0.00 to 1.00 (musical positivity)
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user's focus playlists
CREATE TABLE IF NOT EXISTS focus_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(50) NOT NULL, -- 'spotify', 'apple_music', etc.
    playlist_id VARCHAR(255) NOT NULL, -- External playlist ID
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    genre_tags TEXT[], -- Array of genre tags
    is_favorite BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for music mood correlations
CREATE TABLE IF NOT EXISTS music_mood_correlations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
    mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
    genre VARCHAR(100),
    energy_level DECIMAL(3,2),
    valence_level DECIMAL(3,2),
    session_duration INTEGER, -- in minutes
    productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_connections_user_id ON music_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_music_connections_provider ON music_connections(provider);
CREATE INDEX IF NOT EXISTS idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_played_at ON listening_history(played_at);
CREATE INDEX IF NOT EXISTS idx_listening_history_provider ON listening_history(provider);
CREATE INDEX IF NOT EXISTS idx_music_analytics_user_id ON music_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_music_analytics_timestamp ON music_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_focus_playlists_user_id ON focus_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_playlists_mood_rating ON focus_playlists(mood_rating);
CREATE INDEX IF NOT EXISTS idx_music_mood_correlations_user_id ON music_mood_correlations(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE music_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_mood_correlations ENABLE ROW LEVEL SECURITY;

-- Music connections policies
CREATE POLICY "Users can view their own music connections" ON music_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music connections" ON music_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music connections" ON music_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music connections" ON music_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Listening history policies
CREATE POLICY "Users can view their own listening history" ON listening_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own listening history" ON listening_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listening history" ON listening_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listening history" ON listening_history
    FOR DELETE USING (auth.uid() = user_id);

-- Music analytics policies
CREATE POLICY "Users can view their own music analytics" ON music_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music analytics" ON music_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music analytics" ON music_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music analytics" ON music_analytics
    FOR DELETE USING (auth.uid() = user_id);

-- Focus playlists policies
CREATE POLICY "Users can view their own focus playlists" ON focus_playlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus playlists" ON focus_playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus playlists" ON focus_playlists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus playlists" ON focus_playlists
    FOR DELETE USING (auth.uid() = user_id);

-- Music mood correlations policies
CREATE POLICY "Users can view their own music mood correlations" ON music_mood_correlations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music mood correlations" ON music_mood_correlations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music mood correlations" ON music_mood_correlations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music mood correlations" ON music_mood_correlations
    FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_music_connections_updated_at
    BEFORE UPDATE ON music_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_playlists_updated_at
    BEFORE UPDATE ON focus_playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();