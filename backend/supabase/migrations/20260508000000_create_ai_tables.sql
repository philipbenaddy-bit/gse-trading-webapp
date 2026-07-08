-- Migration: Create AI Market Intelligence Tables
-- Description: Creates tables for AI conversations, messages, audit logs, security events,
--              insights cache, and usage summaries with proper indexes and RLS policies.
-- Requirements: 6.1, 6.4, 6.6, 8.2, 8.3

-- ==================== CONVERSATIONS TABLE ====================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- ==================== CONVERSATION MESSAGES TABLE ====================

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== AI AUDIT LOGS TABLE (append-only) ====================

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_type VARCHAR(30) NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  response_status VARCHAR(20) NOT NULL CHECK (
    response_status IN ('success', 'error', 'timeout', 'rate_limited', 'rejected')
  ),
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

-- ==================== AI SECURITY EVENTS TABLE (append-only) ====================

CREATE TABLE IF NOT EXISTS ai_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sanitized_input VARCHAR(2000) NOT NULL,
  detection_reason VARCHAR(100) NOT NULL
);

-- ==================== AI INSIGHTS CACHE TABLE ====================

CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ==================== AI USAGE SUMMARIES TABLE ====================

CREATE TABLE IF NOT EXISTS ai_usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL UNIQUE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,
  security_events_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_expires_at ON conversations(expires_at);

-- Conversation messages indexes
CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);

-- Audit logs indexes
CREATE INDEX idx_ai_audit_logs_user_id ON ai_audit_logs(user_id);
CREATE INDEX idx_ai_audit_logs_timestamp ON ai_audit_logs(timestamp);
CREATE INDEX idx_ai_audit_logs_status ON ai_audit_logs(response_status);

-- Security events indexes
CREATE INDEX idx_ai_security_events_user_id ON ai_security_events(user_id);

-- Insights cache indexes
CREATE INDEX idx_ai_insights_cache_user_id ON ai_insights_cache(user_id);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- ==================== RLS POLICIES ====================

-- Conversations: Users can only access their own conversations
CREATE POLICY conversations_user_policy ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Conversation messages: Users can only access messages in their own conversations
CREATE POLICY messages_user_policy ON conversation_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Insights cache: Users can only access their own cached insights
CREATE POLICY insights_user_policy ON ai_insights_cache
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs: append-only (INSERT only, no SELECT/UPDATE/DELETE for application credentials)
CREATE POLICY audit_logs_insert_only ON ai_audit_logs
  FOR INSERT WITH CHECK (true);

-- Security events: append-only (INSERT only, no SELECT/UPDATE/DELETE for application credentials)
CREATE POLICY security_events_insert_only ON ai_security_events
  FOR INSERT WITH CHECK (true);

-- ==================== HELPER FUNCTION ====================

-- Function to update updated_at on conversations when a message is added
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW(), message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-update conversation updated_at and message_count when a message is inserted
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- ==================== TABLE COMMENTS ====================

COMMENT ON TABLE conversations IS 'AI conversation threads per user with 90-day expiry';
COMMENT ON TABLE conversation_messages IS 'Individual messages within AI conversations (encrypted at rest via Supabase TDE)';
COMMENT ON TABLE ai_audit_logs IS 'Append-only audit log for all AI interactions (compliance)';
COMMENT ON TABLE ai_security_events IS 'Append-only log of detected security violations (prompt injection, etc.)';
COMMENT ON TABLE ai_insights_cache IS 'Cached AI-generated dashboard insight cards per user';
COMMENT ON TABLE ai_usage_summaries IS 'Daily aggregated AI usage metrics for reporting';
