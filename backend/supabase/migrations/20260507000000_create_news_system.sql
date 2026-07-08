-- Migration: Create News System Tables
-- Description: Creates tables for news, comments, and reactions with proper indexes and RLS policies

-- ==================== NEWS TABLE ====================

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary VARCHAR(500),
  source VARCHAR(200),
  source_url VARCHAR(500),
  image_url VARCHAR(500),
  related_symbols TEXT[], -- Array of stock symbols
  category VARCHAR(50),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  comment_count INTEGER DEFAULT 0 NOT NULL,
  reaction_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for news table
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_created_at ON news(created_at DESC);
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_related_symbols ON news USING GIN(related_symbols);
CREATE INDEX idx_news_trending ON news(view_count DESC, reaction_count DESC, created_at DESC);

-- ==================== COMMENTS TABLE ====================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0 NOT NULL,
  reaction_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for comments table
CREATE INDEX idx_comments_news_id ON comments(news_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_news_created ON comments(news_id, created_at DESC);

-- ==================== REACTIONS TABLE ====================

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('👍', '📈', '📉', '🔥', '💡')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(news_id, user_id) -- One reaction per user per news
);

-- Indexes for reactions table
CREATE INDEX idx_reactions_news_id ON reactions(news_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_news_type ON reactions(news_id, type);

-- ==================== HELPER FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== COUNTER FUNCTIONS ====================

-- Increment news comment count
CREATE OR REPLACE FUNCTION increment_news_comment_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news SET comment_count = comment_count + 1 WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement news comment count
CREATE OR REPLACE FUNCTION decrement_news_comment_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comment reply count
CREATE OR REPLACE FUNCTION increment_comment_reply_count(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments SET reply_count = reply_count + 1 WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comment reply count
CREATE OR REPLACE FUNCTION decrement_comment_reply_count(comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Increment news reaction count
CREATE OR REPLACE FUNCTION increment_news_reaction_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news SET reaction_count = reaction_count + 1 WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement news reaction count
CREATE OR REPLACE FUNCTION decrement_news_reaction_count(news_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE news SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- News policies
CREATE POLICY "News are viewable by everyone"
  ON news FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create news"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own news"
  ON news FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own news"
  ON news FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==================== SAMPLE DATA (Optional) ====================

-- Insert sample news for testing
INSERT INTO news (title, content, summary, source, category, related_symbols) VALUES
  (
    'MTN Ghana Reports Strong Q4 Earnings',
    'MTN Ghana has announced impressive fourth quarter earnings, showing a 15% year-over-year revenue growth. The telecommunications giant attributed this success to increased data usage and expanded network coverage across the country.',
    'MTN Ghana posts 15% revenue growth in Q4 with strong data performance',
    'Ghana Stock Exchange',
    'earnings',
    ARRAY['MTNGH']
  ),
  (
    'GCB Bank Announces Dividend Payment',
    'GCB Bank Limited has declared a dividend of GHS 0.50 per share for the fiscal year 2025. Shareholders on record as of March 31, 2026 will be eligible for the dividend payment.',
    'GCB Bank declares GHS 0.50 dividend per share',
    'Ghana Stock Exchange',
    'dividends',
    ARRAY['GCB']
  ),
  (
    'Ghana Stock Market Reaches New High',
    'The Ghana Stock Exchange Composite Index (GSE-CI) reached a new all-time high today, closing at 3,450 points. Market analysts attribute this milestone to strong corporate earnings and increased foreign investor interest.',
    'GSE-CI hits record high at 3,450 points',
    'Ghana Stock Exchange',
    'market',
    ARRAY['GCB', 'MTNGH', 'TOTAL', 'CAL']
  );

COMMENT ON TABLE news IS 'Stores news articles related to stocks and market';
COMMENT ON TABLE comments IS 'Stores user comments on news articles with threading support';
COMMENT ON TABLE reactions IS 'Stores user reactions (emojis) on news articles';
