-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    three_word_id VARCHAR(100) UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW(),
    theme_preference VARCHAR(10) DEFAULT 'dark' -- 'dark' or 'light'
);

-- Applications table (for verification)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Application data
    what_building TEXT NOT NULL,
    why_join TEXT NOT NULL,
    proof_url TEXT,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, more_info_needed
    admin_notes TEXT,
    rejection_reason TEXT,
    more_info_request TEXT,

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- OTP codes table
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL, -- 'login', 'signup', 'verify'
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_email_purpose ON otp_codes(email, purpose);

-- Sessions table (writing sessions)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Content
    intent VARCHAR(50) NOT NULL,
    raw_content TEXT NOT NULL,
    ai_analysis TEXT NOT NULL,

    -- Metadata
    duration_seconds INTEGER,
    word_count INTEGER,

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Posts table (shared posts)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    three_word_id VARCHAR(100) NOT NULL,

    -- Content
    original_content TEXT NOT NULL,
    anonymized_content TEXT NOT NULL,
    clear_ask TEXT,

    -- Metadata
    intent VARCHAR(50) NOT NULL,
    topics TEXT[] DEFAULT '{}',
    embedding vector(1536),

    -- Engagement
    reaction_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,

    -- Moderation
    is_published BOOLEAN DEFAULT TRUE,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    flag_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for posts
CREATE INDEX posts_user_id_idx ON posts(user_id);
CREATE INDEX posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX posts_topics_idx ON posts USING gin(topics);
CREATE INDEX posts_embedding_idx ON posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX posts_content_search_idx ON posts USING gin(to_tsvector('english', anonymized_content));

-- Reactions table
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX reactions_post_id_idx ON reactions(post_id);
CREATE INDEX reactions_user_id_idx ON reactions(user_id);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    three_word_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX comments_post_id_idx ON comments(post_id);
CREATE INDEX comments_created_at_idx ON comments(created_at);

-- Topic follows table
CREATE TABLE topic_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, topic)
);

CREATE INDEX topic_follows_user_id_idx ON topic_follows(user_id);
CREATE INDEX topic_follows_topic_idx ON topic_follows(topic);

-- Flags table
CREATE TABLE flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Email logs table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    sendgrid_message_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts
    SET reaction_count = (
        SELECT COUNT(*) FROM reactions WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reaction_count_trigger
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts
    SET comment_count = (
        SELECT COUNT(*) FROM comments WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Trigger for updating flag count
CREATE OR REPLACE FUNCTION update_flag_count()
RETURNS TRIGGER AS $$
DECLARE
    flag_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO flag_total
    FROM flags
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);

    UPDATE posts
    SET flag_count = flag_total,
        flagged = (flag_total >= 3),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flag_count_trigger
AFTER INSERT OR DELETE ON flags
FOR EACH ROW EXECUTE FUNCTION update_flag_count();

-- Function to get live stats
CREATE OR REPLACE FUNCTION get_live_stats()
RETURNS TABLE (
    total_builders BIGINT,
    active_today BIGINT,
    total_posts BIGINT,
    posts_this_week BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM users WHERE three_word_id IS NOT NULL) as total_builders,
        (SELECT COUNT(DISTINCT user_id) FROM sessions WHERE started_at > NOW() - INTERVAL '1 day') as active_today,
        (SELECT COUNT(*) FROM posts WHERE is_published = TRUE) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE is_published = TRUE AND created_at > NOW() - INTERVAL '7 days') as posts_this_week;
END;
$$ LANGUAGE plpgsql;
