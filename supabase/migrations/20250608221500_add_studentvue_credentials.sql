-- Create studentvue_credentials table
CREATE TABLE IF NOT EXISTS studentvue_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    district_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE studentvue_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own StudentVue credentials" ON studentvue_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own StudentVue credentials" ON studentvue_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own StudentVue credentials" ON studentvue_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own StudentVue credentials" ON studentvue_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_studentvue_credentials_user_id ON studentvue_credentials(user_id);