-- Function to update daily metrics
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS void AS $$
DECLARE
    today DATE := CURRENT_DATE;
    new_builder_count INTEGER;
    total_builder_count INTEGER;
    session_count INTEGER;
    post_count INTEGER;
BEGIN
    -- Count new builders today
    SELECT COUNT(*) INTO new_builder_count
    FROM users WHERE created_at::date = today;

    -- Count total builders up to today
    SELECT COUNT(*) INTO total_builder_count
    FROM users WHERE created_at::date <= today;

    -- Count sessions completed today
    SELECT COUNT(*) INTO session_count
    FROM sessions WHERE completed_at::date = today;

    -- Count posts created today
    SELECT COUNT(*) INTO post_count
    FROM posts WHERE created_at::date = today AND is_published = TRUE;

    -- Insert or update today's metrics
    INSERT INTO daily_metrics (date, new_builders, total_builders, active_sessions, posts_created)
    VALUES (today, new_builder_count, total_builder_count, session_count, post_count)
    ON CONFLICT (date) DO UPDATE SET
        new_builders = EXCLUDED.new_builders,
        total_builders = EXCLUDED.total_builders,
        active_sessions = EXCLUDED.active_sessions,
        posts_created = EXCLUDED.posts_created;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for users table
CREATE OR REPLACE FUNCTION trigger_update_daily_metrics_users()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_daily_metrics();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for sessions table
CREATE OR REPLACE FUNCTION trigger_update_daily_metrics_sessions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL THEN
        PERFORM update_daily_metrics();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for posts table
CREATE OR REPLACE FUNCTION trigger_update_daily_metrics_posts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = TRUE THEN
        PERFORM update_daily_metrics();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_metrics_on_user_insert ON users;
DROP TRIGGER IF EXISTS update_metrics_on_session_update ON sessions;
DROP TRIGGER IF EXISTS update_metrics_on_post_insert ON posts;

-- Create triggers
CREATE TRIGGER update_metrics_on_user_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_daily_metrics_users();

CREATE TRIGGER update_metrics_on_session_update
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_daily_metrics_sessions();

CREATE TRIGGER update_metrics_on_post_insert
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_daily_metrics_posts();
