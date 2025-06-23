-- Add AI Agent related tables
-- This migration adds tables for storing AI agent conversations and insights

-- Table for storing AI agent conversation history
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_type VARCHAR(10) CHECK (message_type IN ('user', 'bot')) NOT NULL,
    content TEXT NOT NULL,
    actions_suggested JSONB DEFAULT '[]',
    actions_taken JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    insight_type VARCHAR(50) NOT NULL, -- 'productivity', 'mood_pattern', 'study_recommendation', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    data_sources JSONB DEFAULT '[]', -- What data this insight is based on
    is_read BOOLEAN DEFAULT FALSE,
    is_acted_upon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Some insights may expire
);

-- Table for tracking AI agent actions and their outcomes
CREATE TABLE IF NOT EXISTS ai_actions_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'failed')) NOT NULL,
    user_feedback TEXT,
    execution_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_unread ON ai_insights(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_ai_actions_user_id ON ai_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_actions_log(status);

-- Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own AI conversations" ON ai_conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own AI insights" ON ai_insights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own AI actions log" ON ai_actions_log
    FOR ALL USING (auth.uid() = user_id); 