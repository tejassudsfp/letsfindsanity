-- Add title column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title TEXT;

-- Add is_ai_analysis column to comments table to mark AI reflection comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_ai_analysis BOOLEAN DEFAULT FALSE;

-- Create comment_flags table to track flagged comments
CREATE TABLE IF NOT EXISTS comment_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_content TEXT NOT NULL,
    flag_reason TEXT NOT NULL,
    severity TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create blocked_users table to track users who have been blocked from commenting
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comment_flags_user_id ON comment_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
