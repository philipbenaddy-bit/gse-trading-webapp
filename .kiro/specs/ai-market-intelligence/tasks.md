# Implementation Plan: AI Market Intelligence

## Overview

This plan implements the AI Market Intelligence feature for the GSE Trade platform. The implementation follows an incremental approach: database schema first, then core backend services (security → context → orchestration → persistence → compliance), followed by frontend components, and finally integration wiring. Each task builds on previous steps to ensure no orphaned code.

## Tasks

- [x] 1. Database schema and project structure setup
  - [x] 1.1 Create database migration for AI tables
    - Create Supabase migration with tables: `conversations`, `conversation_messages`, `ai_audit_logs`, `ai_security_events`, `ai_insights_cache`, `ai_usage_summaries`
    - Include all indexes, RLS policies, and constraints as defined in the design
    - Ensure `ai_audit_logs` and `ai_security_events` are append-only (INSERT only policy)
    - _Requirements: 6.1, 6.4, 6.6, 8.2, 8.3_

  - [x] 1.2 Set up AI module directory structure and interfaces
    - Create `backend/src/ai/` directory structure matching the design (dto/, services/, templates/, guards/, interfaces/, constants/)
    - Implement all TypeScript interfaces from the design: `ChatMessage`, `ConversationThread`, `ConversationMessage`, `PromptContext`, `MarketDataContext`, `PortfolioDataContext`, `NewsDataContext`, `InsightCard`, `AuditRecord`, `SecurityEvent`, `RateLimitInfo`, `CircuitBreakerState`
    - Create constants file with configuration values (rate limits, token budgets, timeouts)
    - _Requirements: 1.1, 5.1, 5.2, 5.5, 10.3_

  - [x] 1.3 Create DTOs with class-validator decorators
    - Implement `SendMessageDto` with `@IsString()`, `@MinLength(1)`, `@MaxLength(1000)`, optional `@IsUUID()` conversationId
    - Implement `ChatResponseDto`, `ConversationListDto`, `InsightCardDto`
    - _Requirements: 1.7, 4.2_

- [x] 2. Implement security layer (Prompt Guard)
  - [x] 2.1 Implement Prompt Guard service with input sanitization
    - Create `prompt-guard.service.ts` with methods: `sanitize()`, `validate()`, `detectInjection()`
    - Remove Unicode Cc and Cf control characters
    - Collapse consecutive whitespace to single space
    - Reject messages < 2 non-whitespace chars or > 2000 chars
    - Detect role-override instructions, system prompt extraction attempts, delimiter injection sequences
    - Return generic refusal on injection detection without revealing which rule triggered
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 2.2 Implement PII stripping within Prompt Guard
    - Add PII detection for: email addresses, phone numbers, Ghana Card numbers, bank account details, user names
    - Replace each PII instance with consistent anonymized identifier per conversation session
    - Maintain a session-scoped mapping so same PII always maps to same anonymized ID
    - _Requirements: 4.5_

  - [x]* 2.3 Write property tests for Prompt Guard (Properties 4, 11, 12)
    - **Property 4: Input sanitization and validation** — verify control char removal, whitespace collapse, length rejection, injection rejection
    - **Property 11: PII stripping with consistent anonymization** — verify PII replacement and session consistency
    - **Property 12: Security violations produce uniform generic response** — verify same generic message for all violation types
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.7**

- [x] 3. Implement Context Builder service
  - [x] 3.1 Implement stock symbol extraction and market data context
    - Create `context-builder.service.ts` with method `buildContext()`
    - Implement GSE stock symbol/company name matching from user messages
    - Retrieve market data from existing `GseService` in-memory cache (no external API calls)
    - Include current price, daily change percentage, and trading volume for matched stocks
    - Include GSE Composite Index, top 5 gainers, top 5 losers by daily change percentage
    - Add data freshness timestamp when market data is older than 30 minutes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Implement portfolio context assembly
    - Add portfolio data retrieval using existing Supabase portfolio service with RLS enforcement
    - Include up to 20 holdings sorted by current value descending (symbol, quantity, avg cost, current value, unrealized P&L)
    - Enforce KYC gate: exclude portfolio data for non-KYC-verified users
    - Handle empty portfolio case (omit portfolio context, inform user)
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

  - [x] 3.3 Implement news context assembly
    - Retrieve news from existing `NewsAggregatorService`
    - For stock queries: up to 3 articles matching stock symbol via `relatedSymbols`, within last 7 days
    - For sentiment queries: up to 5 trending headlines sorted by view count
    - Include only article summary field, truncated to 200 characters
    - Handle news service unavailability gracefully
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x]* 3.4 Write property tests for Context Builder (Properties 5, 6, 7, 8, 9, 23, 24, 25)
    - **Property 5: Stock symbol extraction includes market data** — verify matched symbols get price/change/volume
    - **Property 6: Top gainers and losers correctly sorted** — verify top 5 ascending/descending sort
    - **Property 7: Data freshness warning** — verify 30-minute threshold for timestamp inclusion
    - **Property 8: No stock-specific data without symbol match** — verify no stock data when no match
    - **Property 9: Portfolio context is capped and sorted** — verify max 20 holdings, descending value sort
    - **Property 23: News filtering by symbol and recency** — verify symbol match + 7-day filter + max 3
    - **Property 24: Trending news selection by view count** — verify max 5, sorted by views descending
    - **Property 25: News summary truncation** — verify summary-only, max 200 chars
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.6, 3.1, 9.1, 9.2, 9.3, 9.5**

- [ ] 4. Implement Rate Limiter and Circuit Breaker
  - [x] 4.1 Implement Rate Limiter service with Redis sliding window
    - Create `rate-limiter.service.ts` using Redis sorted sets for sliding window
    - Enforce 30 requests per user per rolling 60-minute window
    - Enforce 100 requests per user per rolling 24-hour window
    - Return which limit was exceeded and seconds until next available request
    - Track per authenticated user using unique user identifier
    - Do not count failed LLM requests against rate limits
    - Flag accounts exceeding 25 requests/10 minutes or 90 requests/12 hours for review
    - Fall back to in-memory rate limiting if Redis is unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7_

  - [-] 4.2 Implement Circuit Breaker service
    - Create `circuit-breaker.service.ts` with state machine: CLOSED → OPEN → HALF-OPEN → CLOSED
    - Trip after 5 consecutive failures within 5-minute window
    - Block requests for 60 seconds in OPEN state
    - Allow single test request in HALF-OPEN state
    - Transition to CLOSED on successful test, back to OPEN on failed test
    - Store state in Redis for persistence across restarts
    - _Requirements: 10.1, 10.3_

  - [ ]* 4.3 Write property tests for Rate Limiter (Properties 13, 14, 15)
    - **Property 13: Rate limiting correctness** — verify 30/hour and 100/day limits, rejection messages, user isolation
    - **Property 14: Token budget truncation** — verify 4000-token truncation
    - **Property 15: Failed requests exempt from rate limit** — verify failed requests don't count
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7**

  - [ ]* 4.4 Write property tests for Circuit Breaker (Property 27)
    - **Property 27: Circuit breaker state machine** — verify state transitions: 5 failures → OPEN, 60s → HALF-OPEN, success → CLOSED, failure → OPEN
    - **Validates: Requirements 10.3**

- [~] 5. Checkpoint - Core services verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Conversation Store and Disclaimer Engine
  - [-] 6.1 Implement Conversation Store service
    - Create `conversation-store.service.ts` with CRUD operations for conversations and messages
    - Create new conversation threads with unique UUID
    - Persist messages with role, content, token count
    - Maintain conversation context window (most recent 50 messages)
    - Set `expires_at` to creation time + 90 days
    - Support soft-delete for conversation deletion requests
    - Enforce RLS via Supabase client (users access only their own data)
    - List conversations sorted by most recent `updated_at`
    - _Requirements: 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 6.2 Implement Disclaimer Engine service
    - Create `disclaimer-engine.service.ts` that appends financial disclaimer to all AI responses
    - Disclaimer text: content is informational only and not investment advice
    - Ensure disclaimer is always present in user-facing output
    - _Requirements: 1.5, 7.4_

  - [ ]* 6.3 Write property tests for Conversation Store (Properties 1, 16)
    - **Property 1: Conversation context window is bounded** — verify exactly 50 most recent messages in chronological order
    - **Property 16: Conversation expiry calculation** — verify expires_at = created_at + 90 days
    - **Validates: Requirements 1.2, 6.4**

  - [ ]* 6.4 Write property tests for Disclaimer Engine (Property 2)
    - **Property 2: Financial disclaimer is always appended** — verify disclaimer present in all AI responses
    - **Validates: Requirements 1.5**

- [ ] 7. Implement Audit Logger service
  - [~] 7.1 Implement Audit Logger service
    - Create `audit-logger.service.ts` with methods: `logInteraction()`, `logSecurityEvent()`, `generateDailySummary()`, `queryAuditRecords()`
    - Record: user ID, ISO 8601 UTC timestamp, request type, token count, response status (success/error/timeout/rate_limited/rejected)
    - Exclude raw LLM responses from audit records
    - Log security events with sanitized input (max 2000 chars) and detection reason
    - Implement retry queue for failed audit persistence (retry within 5 minutes)
    - Never disrupt AI interactions if audit logging fails
    - Provide query interface for searching by user ID, date range, request type, response status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 7.2 Write property tests for Audit Logger (Properties 20, 21, 22)
    - **Property 20: Audit record completeness and content exclusion** — verify all required fields present, no raw LLM response
    - **Property 21: Security event logging with truncation** — verify sanitized input max 2000 chars, detection reason present
    - **Property 22: Daily summary aggregation correctness** — verify correct computation of totals, unique users, avg response time, security event count
    - **Validates: Requirements 8.1, 8.4, 8.5, 8.6**

- [ ] 8. Implement Insight Generator service
  - [~] 8.1 Implement Insight Generator service
    - Create `insight-generator.service.ts` for dashboard insight card generation
    - Generate up to 3 insight cards based on user's portfolio + market conditions
    - Use top 5 holdings by portfolio value + up to 5 matching news articles
    - Enforce 4-hour refresh throttle per user (serve cached insights if fresher)
    - Cache insights in `ai_insights_cache` table with 24-hour expiry
    - Handle LLM unavailability: serve cached insights if < 24 hours old, hide section otherwise
    - For users with no holdings: generate insights based on GSE Composite Index + trending news
    - Enforce format constraints: title ≤ 80 chars, summary ≤ 150 chars, relevance symbol, disclaimer
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.2 Write property tests for Insight Generator (Properties 17, 18, 19)
    - **Property 17: Insight refresh throttle** — verify no new LLM generation within 4 hours
    - **Property 18: Insight context assembly** — verify max 5 holdings, max 5 matching news articles
    - **Property 19: Insight card format constraints** — verify title ≤ 80, summary ≤ 150, relevance symbol, disclaimer
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 9. Implement AI Service orchestrator and prompt templates
  - [~] 9.1 Create parameterized prompt templates
    - Create `templates/system-prompt.template.ts` constraining LLM to GSE topics only, preventing disclosure of system instructions/API keys/architecture
    - Create `templates/stock-query.template.ts` for stock-specific queries with market data placeholders
    - Create `templates/portfolio-query.template.ts` for portfolio analysis with holdings placeholders
    - Use parameterized templates (no string concatenation) to prevent injection via data
    - _Requirements: 4.4, 4.6_

  - [~] 9.2 Implement AI Service orchestrator
    - Refactor existing `ai.service.ts` to orchestrate all sub-services
    - Flow: validate input → check rate limit → sanitize → build context → check circuit breaker → call LLM → validate output → persist → audit → attach disclaimer → respond
    - Implement LLM call with 5-second timeout, max 4000 token response budget
    - Validate LLM output: reject responses containing system prompt fragments, API keys, internal service names, other users' PII
    - Handle fallback: preserve user message on LLM failure, return fallback response
    - Support dual LLM providers: OpenAI GPT-4o-mini primary, Anthropic Claude 3 Haiku fallback
    - Provide analysis without explicit buy/sell/hold directives for recommendation queries
    - Include source name and publication date when citing news
    - Report unavailable data sources in response
    - _Requirements: 1.1, 1.6, 3.3, 4.4, 4.7, 5.5, 9.4, 10.1, 10.2, 10.5_

  - [ ]* 9.3 Write property tests for AI Service (Properties 3, 26, 28)
    - **Property 3: Failed LLM preserves user message** — verify message persisted and fallback returned on failure
    - **Property 26: Unsafe LLM output rejection** — verify responses with system prompt/API keys/service names are discarded
    - **Property 28: Unavailable data sources reported** — verify exact unavailable sources listed, available sources included
    - **Validates: Requirements 1.6, 10.2, 10.5**

- [ ] 10. Implement AI Controller and Rate Limit Guard
  - [~] 10.1 Implement AI Controller with REST endpoints
    - Create/refactor `ai.controller.ts` with all API endpoints from design
    - `POST /api/v1/ai/chat` — send message (with optional conversationId for existing threads)
    - `POST /api/v1/ai/conversations` — create new conversation
    - `GET /api/v1/ai/conversations` — list user's conversations (sorted by most recent)
    - `GET /api/v1/ai/conversations/:id` — get full conversation history
    - `DELETE /api/v1/ai/conversations/:id` — request conversation deletion
    - `GET /api/v1/ai/insights` — get dashboard insight cards
    - `GET /api/v1/ai/status` — get circuit breaker state
    - `GET /api/v1/ai/rate-limit` — get current rate limit status
    - Apply JWT auth guard to all endpoints
    - Add Swagger decorators for API documentation
    - _Requirements: 1.1, 1.3, 6.2, 6.3, 6.5, 7.1_

  - [~] 10.2 Implement AI Rate Limit Guard
    - Create `guards/ai-rate-limit.guard.ts` as NestJS guard
    - Integrate with Rate Limiter service to check limits before request processing
    - Return 429 with rate limit info when exceeded
    - _Requirements: 5.1, 5.2, 5.3_

  - [~] 10.3 Register AI module with all providers
    - Update `ai.module.ts` to register all new services, guards, and controllers
    - Ensure proper dependency injection for GseService, NewsAggregatorService, PortfolioService, SupabaseService, Redis
    - Import required modules (Redis module, Supabase module, etc.)
    - _Requirements: All_

- [~] 11. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement frontend AI API client and store
  - [~] 12.1 Create AI API client functions
    - Create `frontend/src/lib/aiApi.ts` with typed API functions
    - `sendMessage(message, conversationId?)` — POST /api/v1/ai/chat
    - `createConversation()` — POST /api/v1/ai/conversations
    - `getConversations()` — GET /api/v1/ai/conversations
    - `getConversation(id)` — GET /api/v1/ai/conversations/:id
    - `deleteConversation(id)` — DELETE /api/v1/ai/conversations/:id
    - `getInsights()` — GET /api/v1/ai/insights
    - `getAiStatus()` — GET /api/v1/ai/status
    - `getRateLimit()` — GET /api/v1/ai/rate-limit
    - Use existing axios client with auth interceptors
    - _Requirements: 1.1, 6.2, 6.3, 7.1_

  - [~] 12.2 Create Zustand AI Chat store
    - Create `frontend/src/store/aiChatStore.ts` with state for:
    - Current conversation messages (up to 50 in session)
    - Active conversation ID
    - Conversation list
    - Typing indicator state
    - Circuit breaker status
    - Rate limit info
    - Error states
    - Actions: sendMessage, loadConversation, createConversation, deleteConversation, setTyping, updateStatus
    - _Requirements: 1.2, 1.4, 10.4_

  - [~] 12.3 Create React Query hooks for AI features
    - Create `frontend/src/hooks/useAiChat.ts` — mutation hook for sending messages
    - Create `frontend/src/hooks/useAiConversations.ts` — query hook for conversation list and history
    - Create `frontend/src/hooks/useAiInsights.ts` — query hook for dashboard insights with stale-while-revalidate
    - Handle loading, error, and success states
    - _Requirements: 1.1, 6.2, 7.1_

- [ ] 13. Implement frontend AI Chat components
  - [~] 13.1 Implement AI Chat Panel and Message components
    - Create `frontend/src/components/ai/AiChatPanel.tsx` — main chat container (embeddable or standalone)
    - Create `frontend/src/components/ai/AiMessageBubble.tsx` — individual message display with role-based styling
    - Create `frontend/src/components/ai/AiTypingIndicator.tsx` — animated typing indicator shown during processing
    - Create `frontend/src/components/ai/AiDisclaimer.tsx` — financial disclaimer component displayed with each AI response
    - _Requirements: 1.1, 1.4, 1.5_

  - [~] 13.2 Implement AI Input Bar with validation
    - Create `frontend/src/components/ai/AiInputBar.tsx` — message input with character count
    - Validate: reject empty messages and messages > 1000 characters
    - Display error message indicating allowed input length on validation failure
    - Disable input while waiting for response (typing indicator active)
    - _Requirements: 1.7_

  - [~] 13.3 Implement Conversation List and AI Chat Page
    - Create `frontend/src/components/ai/AiConversationList.tsx` — sidebar showing past conversations sorted by most recent
    - Create `frontend/src/pages/AiChatPage.tsx` — full-page AI chat view with conversation list + chat panel
    - Support creating new conversations and selecting past conversations to view full history
    - _Requirements: 6.2, 6.3_

  - [~] 13.4 Implement AI Status Banner and error states
    - Create `frontend/src/components/ai/AiStatusBanner.tsx` — circuit breaker status indicator
    - Display notification when AI transitions to circuit-breaker state
    - Show rate limit information when limits are approached/exceeded
    - Ensure chat interface remains navigable during circuit-breaker state with cached history visible
    - _Requirements: 10.4, 10.6, 5.3_

- [ ] 14. Implement Dashboard Insight Cards
  - [~] 14.1 Implement AI Insight Card component and dashboard integration
    - Create `frontend/src/components/ai/AiInsightCard.tsx` — displays title, summary, relevance symbol, disclaimer
    - Integrate insight cards into existing dashboard page (up to 3 cards)
    - Show cached insights while new generation is in progress
    - Hide insights section gracefully if no valid cache exists and LLM is unavailable
    - _Requirements: 7.1, 7.4, 7.5_

- [ ] 15. Integration wiring and routing
  - [~] 15.1 Wire AI Chat page into application routing
    - Add route for `/ai-chat` in the React Router configuration
    - Add navigation link to AI Chat in the application layout/sidebar
    - Ensure proper authentication guard on the route
    - _Requirements: 1.1_

  - [~] 15.2 Wire dashboard insights into existing Dashboard page
    - Import and render `AiInsightCard` components on the existing `DashboardPage.tsx`
    - Use `useAiInsights` hook to fetch and display insight cards
    - Handle loading and error states gracefully
    - _Requirements: 7.1_

  - [ ]* 15.3 Write integration tests for end-to-end AI chat flow
    - Test full request flow: input → validation → rate limit → sanitize → context → LLM (mocked) → response
    - Test RLS enforcement (cross-user access prevention)
    - Test conversation persistence and retrieval
    - Test rate limit behavior with Redis
    - Test circuit breaker activation and recovery
    - _Requirements: 1.1, 5.1, 6.1, 10.3_

- [~] 16. Final checkpoint - Full feature verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `AiService`, `GseService`, `NewsAggregatorService`, and `PortfolioService` are extended/consumed — not replaced
- Redis is used for rate limiting and circuit breaker state; falls back to in-memory if unavailable
- All LLM calls use parameterized prompt templates to prevent injection
- Frontend uses existing axios client with JWT auth interceptors

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["9.3", "10.1", "10.2"] },
    { "id": 10, "tasks": ["10.3"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3", "13.1"] },
    { "id": 13, "tasks": ["13.2", "13.3", "13.4"] },
    { "id": 14, "tasks": ["14.1"] },
    { "id": 15, "tasks": ["15.1", "15.2"] },
    { "id": 16, "tasks": ["15.3"] }
  ]
}
```
