-- Migration: Add Spotify authentication support
-- Created: 2024-12-20

-- Add spotify_id column to users table for Spotify OAuth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS spotify_id VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);

-- Update RLS policies to allow Spotify-based authentication
-- (The existing policies should already cover this, but we can add specific ones if needed)

-- Add comment for documentation
COMMENT ON COLUMN users.spotify_id IS 'Spotify user ID for OAuth authentication';