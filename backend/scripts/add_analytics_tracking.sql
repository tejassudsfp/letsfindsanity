-- API Usage Analytics Table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    service VARCHAR(50) NOT NULL, -- 'claude' or 'openai'
    operation VARCHAR(100) NOT NULL, -- 'analysis', 'embedding', etc.
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, service, operation)
);

-- Index for faster date range queries
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);

-- Daily metrics table for builder growth and activity
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    new_builders INTEGER DEFAULT 0,
    total_builders INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    posts_created INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
