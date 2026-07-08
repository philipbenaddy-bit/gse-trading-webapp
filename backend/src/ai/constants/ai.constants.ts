/**
 * AI Market Intelligence - Configuration Constants
 *
 * Centralized configuration values for rate limits, token budgets,
 * circuit breaker thresholds, conversation settings, insight caching,
 * and service timeouts.
 */

// ── Rate Limiting ───────────────────────────────────────────────────────────

/** Maximum AI requests per user per rolling 60-minute window */
export const RATE_LIMIT_HOURLY = 30;

/** Maximum AI requests per user per rolling 24-hour window */
export const RATE_LIMIT_DAILY = 100;

/** Hourly rate limit sliding window duration in seconds */
export const RATE_LIMIT_WINDOW_HOURLY_SECONDS = 3600;

/** Daily rate limit sliding window duration in seconds */
export const RATE_LIMIT_WINDOW_DAILY_SECONDS = 86400;

/** Threshold for flagging suspicious activity: requests per 10 minutes */
export const RATE_LIMIT_FLAG_PER_10_MIN = 25;

/** Threshold for flagging suspicious activity: requests per 12 hours */
export const RATE_LIMIT_FLAG_PER_12_HOURS = 90;

// ── Token Budget ────────────────────────────────────────────────────────────

/** Maximum tokens allowed per LLM response */
export const TOKEN_BUDGET_MAX = 4000;

// ── Circuit Breaker ─────────────────────────────────────────────────────────

/** Number of consecutive failures to trip the circuit breaker */
export const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;

/** Time window (ms) in which failures are counted */
export const CIRCUIT_BREAKER_FAILURE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Recovery timeout (ms) before transitioning from OPEN to HALF-OPEN */
export const CIRCUIT_BREAKER_RECOVERY_TIMEOUT_MS = 60 * 1000; // 60 seconds

// ── Conversation ────────────────────────────────────────────────────────────

/** Maximum number of messages included in conversation context window */
export const CONVERSATION_CONTEXT_WINDOW = 50;

/** Conversation expiry period in days */
export const CONVERSATION_EXPIRY_DAYS = 90;

// ── Insight Cards ───────────────────────────────────────────────────────────

/** Minimum time (ms) between insight regeneration per user */
export const INSIGHT_REFRESH_THROTTLE_MS = 4 * 60 * 60 * 1000; // 4 hours

/** Insight cache expiry (ms) */
export const INSIGHT_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Maximum number of insight cards generated per user */
export const INSIGHT_MAX_CARDS = 3;

/** Maximum title length for insight cards */
export const INSIGHT_TITLE_MAX_LENGTH = 80;

/** Maximum summary length for insight cards */
export const INSIGHT_SUMMARY_MAX_LENGTH = 150;

// ── Timeouts ────────────────────────────────────────────────────────────────

/** LLM provider request timeout (ms) */
export const LLM_TIMEOUT_MS = 5000; // 5 seconds

/** Data source (market, portfolio, news) request timeout (ms) */
export const DATA_SOURCE_TIMEOUT_MS = 3000; // 3 seconds

// ── Input Validation ────────────────────────────────────────────────────────

/** Maximum allowed input message length (Prompt Guard validation) */
export const INPUT_MAX_LENGTH = 2000;

/** Minimum non-whitespace characters required */
export const INPUT_MIN_NON_WHITESPACE = 2;

/** Maximum user input length for chat DTO validation */
export const MAX_USER_INPUT_LENGTH = 1000;

/** Maximum characters stored for security event sanitized input */
export const SECURITY_EVENT_INPUT_MAX_LENGTH = 2000;

// ── Context Assembly ────────────────────────────────────────────────────────

/** Maximum portfolio holdings included in context */
export const PORTFOLIO_CONTEXT_MAX_HOLDINGS = 20;

/** Maximum news articles for stock-specific queries */
export const NEWS_STOCK_QUERY_MAX_ARTICLES = 3;

/** Maximum trending news articles */
export const NEWS_TRENDING_MAX_ARTICLES = 5;

/** News recency window in days */
export const NEWS_RECENCY_DAYS = 7;

/** Maximum news summary length in characters */
export const NEWS_SUMMARY_MAX_LENGTH = 200;

/** Data freshness warning threshold (ms) */
export const DATA_FRESHNESS_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/** Maximum holdings used for insight generation */
export const INSIGHT_CONTEXT_MAX_HOLDINGS = 5;

/** Maximum news articles used for insight generation */
export const INSIGHT_CONTEXT_MAX_NEWS = 5;

// ── Redis Key Prefixes ──────────────────────────────────────────────────────

export const REDIS_KEY_RATE_HOURLY = 'ai:rate:hourly';
export const REDIS_KEY_RATE_DAILY = 'ai:rate:daily';
export const REDIS_KEY_CIRCUIT_STATE = 'ai:circuit:state';
export const REDIS_KEY_CIRCUIT_FAILURES = 'ai:circuit:failures';
export const REDIS_KEY_CIRCUIT_LAST_FAILURE = 'ai:circuit:last_failure';
export const REDIS_KEY_CIRCUIT_OPEN_UNTIL = 'ai:circuit:open_until';
