# Requirements Document

## Introduction

AI Market Intelligence is a feature that integrates large language model (LLM) capabilities into the GSE Trade platform to help users understand the Ghana Stock Exchange market better. The feature provides AI-powered stock analysis, market trend explanations, portfolio insights, and conversational market education — all within a secure, finance-grade architecture. The system acts as an intelligent assistant that contextualizes real-time GSE market data, news, and user portfolio information to deliver personalized, actionable insights while maintaining strict security boundaries appropriate for financial applications.

## Glossary

- **AI_Service**: The backend NestJS module responsible for orchestrating LLM API calls, managing conversation context, and enforcing security policies on AI interactions
- **AI_Chat_Interface**: The frontend conversational UI component where users interact with the AI assistant
- **LLM_Provider**: The external large language model API (OpenAI GPT or Anthropic Claude) used for generating market intelligence responses
- **Prompt_Guard**: The security layer that validates, sanitizes, and constrains all user inputs before they reach the LLM_Provider
- **Context_Builder**: The service that assembles relevant market data, news, and portfolio information into structured context for LLM prompts
- **Conversation_Store**: The encrypted database storage for user conversation history and AI interaction audit logs
- **Rate_Limiter**: The throttling mechanism that controls AI request frequency per user to prevent abuse and manage costs
- **Insight_Card**: A structured UI component displaying AI-generated market insights on the dashboard
- **Market_Data_Context**: Real-time and historical GSE stock data assembled from the existing market data service
- **User_Portfolio_Context**: The authenticated user's holdings, orders, and transaction history used to personalize AI responses
- **Disclaimer_Engine**: The component that attaches mandatory financial disclaimers to all AI-generated content
- **Audit_Logger**: The service that records all AI interactions for compliance and security monitoring

## Requirements

### Requirement 1: AI Conversational Interface

**User Story:** As a trader, I want to ask questions about GSE stocks and market trends in natural language, so that I can understand market dynamics without needing financial expertise.

#### Acceptance Criteria

1. WHEN a user submits a question of 1 to 1000 characters via the AI_Chat_Interface, THE AI_Service SHALL return a response that references the user's current or prior conversation messages within 10 seconds
2. WHILE a user is authenticated, THE AI_Chat_Interface SHALL maintain up to the most recent 50 messages of conversation context for the duration of the user session
3. WHEN a user starts a new conversation, THE AI_Service SHALL create a new conversation thread with a unique identifier
4. WHILE the AI_Service is processing a request, THE AI_Chat_Interface SHALL display a typing indicator until the response is received or an error occurs
5. WHEN the AI_Service generates a response, THE Disclaimer_Engine SHALL append a financial disclaimer stating that the content is informational and not investment advice
6. IF the LLM_Provider returns an error or fails to respond within 10 seconds, THEN THE AI_Service SHALL return a fallback message indicating temporary unavailability and preserve the user's original question in the conversation thread
7. IF the user submits an empty message or a message exceeding 1000 characters, THEN THE AI_Chat_Interface SHALL reject the submission and display an error message indicating the allowed input length

### Requirement 2: Market Data Contextualization

**User Story:** As a trader, I want the AI to have access to current GSE market data when answering my questions, so that responses are grounded in real market conditions.

#### Acceptance Criteria

1. WHEN a user asks about a specific GSE stock, THE Context_Builder SHALL identify the stock by matching recognized GSE stock symbols or company names in the user's message and include the stock's current price, daily change percentage, and trading volume in the LLM prompt context
2. WHEN a user asks about market trends, THE Context_Builder SHALL include the GSE Composite Index value and the top 5 gainers and top 5 losers by daily change percentage for the current trading session in the LLM prompt context
3. THE Context_Builder SHALL retrieve market data from the existing GSE market data service's in-memory cache without making additional external API calls
4. WHEN market data is older than 30 minutes, THE Context_Builder SHALL include the last-updated timestamp in a human-readable format within the AI response context so the user can assess data freshness
5. IF market data is unavailable, THEN THE AI_Service SHALL inform the user that current market data is temporarily unavailable and respond with general educational content only, without referencing specific current prices, volumes, or percentage changes
6. IF the Context_Builder cannot match any recognized GSE stock symbol or company name from the user's message, THEN THE Context_Builder SHALL proceed without stock-specific market data and THE AI_Service SHALL respond based on general market knowledge only

### Requirement 3: Portfolio-Aware Insights

**User Story:** As a trader, I want the AI to understand my portfolio when providing analysis, so that I receive personalized insights relevant to my holdings.

#### Acceptance Criteria

1. WHEN a user asks about their portfolio, THE Context_Builder SHALL include the user's current holdings (symbol, quantity, average purchase price, current value, and unrealized gain or loss per holding) for up to 20 holdings sorted by current value descending in the LLM prompt context
2. THE AI_Service SHALL access only the authenticated user's portfolio data and no other user's data
3. WHEN a user asks for a recommendation, THE AI_Service SHALL provide analysis that names relevant factors (such as price trends, volume, news sentiment, and diversification) without including explicit buy, sell, or hold directives
4. WHILE the user has not completed KYC verification, THE AI_Service SHALL exclude the user's specific holdings, cost basis, and P&L figures from responses and limit portfolio-related responses to general stock market educational content only
5. THE Context_Builder SHALL retrieve portfolio data using the existing Supabase portfolio service with Row Level Security enforcement
6. IF the authenticated user's portfolio contains no holdings, THEN THE Context_Builder SHALL omit portfolio context from the LLM prompt and THE AI_Service SHALL inform the user that portfolio-specific analysis is available once they hold at least one stock

### Requirement 4: Security and Input Validation

**User Story:** As a platform operator, I want all AI interactions to be secured against prompt injection, data leakage, and abuse, so that the system maintains financial-grade security standards.

#### Acceptance Criteria

1. WHEN a user submits a message, THE Prompt_Guard SHALL sanitize the input by removing control characters (Unicode categories Cc and Cf), collapsing consecutive whitespace characters to a single space, and rejecting messages that match role-override instructions, system prompt extraction attempts, or delimiter injection sequences, before forwarding to the LLM_Provider
2. IF a user message exceeds 2000 characters or contains fewer than 2 non-whitespace characters, THEN THE Prompt_Guard SHALL reject the message and return a validation error indicating the length constraint violated
3. WHEN the Prompt_Guard detects a prompt injection attempt, THE AI_Service SHALL log the attempt via the Audit_Logger and return a generic refusal response that does not reveal which detection rule was triggered
4. THE AI_Service SHALL enforce a system prompt that constrains the LLM to Ghana Stock Exchange listed stocks, GSE market indices, trading concepts, GSE-related financial news, and portfolio analysis topics only, and prevents disclosure of system instructions, API keys, or internal architecture
5. THE AI_Service SHALL strip personally identifiable information including user names, email addresses, phone numbers, Ghana Card numbers, and bank account details from data sent to the LLM_Provider, replacing each with a consistent anonymized identifier per conversation session
6. WHEN constructing prompts, THE Context_Builder SHALL use parameterized prompt templates rather than string concatenation to prevent injection via market data or news content
7. WHEN the LLM_Provider returns a response, THE AI_Service SHALL validate that the response does not contain system prompt fragments, API keys, internal service names, or other users' personally identifiable information before delivering it to the user

### Requirement 5: Rate Limiting and Cost Control

**User Story:** As a platform operator, I want to control AI usage per user, so that costs remain predictable and the service remains available to all users.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a maximum of 30 AI requests per user per rolling 60-minute window
2. THE Rate_Limiter SHALL enforce a maximum of 100 AI requests per user per rolling 24-hour window
3. IF a user submits an AI request that would exceed either the hourly or daily rate limit, THEN THE AI_Service SHALL reject the request and return a response indicating the limit has been reached, which limit was exceeded, and the number of seconds remaining until the next available request
4. THE Rate_Limiter SHALL track usage per authenticated user using their unique user identifier
5. THE AI_Service SHALL enforce a maximum token budget of 4000 tokens per individual LLM request, truncating the LLM response at the 4000-token limit if the response exceeds that budget
6. WHILE a user has submitted more than 25 AI requests within a 10-minute period or more than 90 requests within a 12-hour period, THE Audit_Logger SHALL flag the account for review
7. IF the AI_Service receives a request while the LLM provider is unavailable or returns an error, THEN THE AI_Service SHALL return a response indicating a temporary service issue and SHALL NOT count the failed request against the user's rate limit

### Requirement 6: Conversation History and Persistence

**User Story:** As a trader, I want to review my past AI conversations, so that I can reference previous analysis and track how my understanding has evolved.

#### Acceptance Criteria

1. WHEN a user completes a conversation, THE Conversation_Store SHALL persist the conversation thread with all messages encrypted at rest
2. THE AI_Chat_Interface SHALL allow users to view a list of their past conversations sorted by most recent
3. WHEN a user selects a past conversation, THE AI_Chat_Interface SHALL display the full message history for that thread
4. THE Conversation_Store SHALL retain conversation history for 90 days, after which conversations are permanently deleted
5. WHEN a user requests deletion of a conversation, THE Conversation_Store SHALL permanently remove all messages in that thread within 24 hours
6. THE Conversation_Store SHALL enforce Row Level Security so that users can only access their own conversation history

### Requirement 7: AI-Powered Dashboard Insights

**User Story:** As a trader, I want to see AI-generated market insights on my dashboard without asking questions, so that I stay informed about relevant market developments passively.

#### Acceptance Criteria

1. WHEN a user loads the dashboard, THE AI_Service SHALL generate up to 3 Insight_Cards based on the user's portfolio holdings and current market conditions within 15 seconds, serving cached insights while generation is in progress if cached insights exist
2. THE AI_Service SHALL refresh dashboard insights no more frequently than once every 4 hours per user to manage costs
3. WHEN generating Insight_Cards, THE Context_Builder SHALL combine the user's top 5 holdings by portfolio value with up to 5 news articles whose relatedSymbols match the user's holding symbols from the existing news aggregator service
4. THE Insight_Card SHALL display a title of no more than 80 characters, summary text of no more than 150 characters, a relevance indicator linking it to a specific stock symbol or market event, and a financial disclaimer indicating the content is informational only
5. IF the AI_Service cannot generate insights due to LLM_Provider unavailability, THEN THE dashboard SHALL display the most recently cached insights if they are no older than 24 hours, or hide the insights section without displaying error messages if no valid cache exists
6. IF the user has no portfolio holdings, THEN THE AI_Service SHALL generate Insight_Cards based on GSE Composite Index performance and trending market news only

### Requirement 8: Audit Logging and Compliance

**User Story:** As a platform operator, I want comprehensive audit logs of all AI interactions, so that I can demonstrate compliance with financial regulations and investigate incidents.

#### Acceptance Criteria

1. WHEN an AI interaction occurs, THE Audit_Logger SHALL record the user identifier, ISO 8601 UTC timestamp, request type, token count, and response status where response status is one of: success, error, timeout, rate_limited, or rejected
2. THE Audit_Logger SHALL store audit records in a separate database table with write-only access from the application layer and no update or delete permissions granted to application-level credentials
3. THE Audit_Logger SHALL retain audit logs for a minimum of 365 days
4. WHEN a security event is detected by the Prompt_Guard, THE Audit_Logger SHALL record the full sanitized input up to 2000 characters and the detection reason categorizing the type of security violation
5. THE Audit_Logger SHALL generate a daily summary of AI usage metrics once per calendar day at a configurable time, including total requests, unique users, average response time in milliseconds, and count of security events
6. THE Audit_Logger SHALL exclude raw LLM responses from audit logs to prevent storage of potentially sensitive generated content
7. IF the Audit_Logger fails to persist an audit record, THEN THE AI_Service SHALL proceed with the AI interaction without disruption and queue the failed audit record for retry within 5 minutes
8. THE Audit_Logger SHALL provide a query interface allowing platform operators to search audit records by user identifier, date range, request type, and response status for compliance reporting and incident investigation

### Requirement 9: News-Informed Analysis

**User Story:** As a trader, I want the AI to incorporate recent Ghana financial news into its analysis, so that I understand how current events may affect my investments.

#### Acceptance Criteria

1. WHEN a user asks about a stock, THE Context_Builder SHALL include up to 3 news articles from the existing news aggregator service that match the stock's symbol via the relatedSymbols field, filtered to articles published within the last 7 days, in the LLM prompt context
2. WHEN a user asks about market sentiment, THE Context_Builder SHALL include up to 5 trending news headlines sorted by view count and their associated stock symbols from the existing news aggregator service
3. THE Context_Builder SHALL filter news articles to include only those published within the last 7 days based on the article's createdAt timestamp
4. WHEN citing news in a response, THE AI_Service SHALL include the source name and publication date for each referenced article
5. THE Context_Builder SHALL include only the article summary field rather than full article content, with each summary limited to 200 characters, to manage token usage
6. IF the news aggregator service returns no matching articles or is unavailable, THEN THE Context_Builder SHALL proceed without news context and THE AI_Service SHALL indicate in the response that recent news data is not available for the queried topic

### Requirement 10: Error Handling and Graceful Degradation

**User Story:** As a trader, I want the AI feature to handle failures gracefully, so that my overall trading experience is not disrupted when AI services are unavailable.

#### Acceptance Criteria

1. IF the LLM_Provider does not respond within 5 seconds or returns a network error, THEN THE AI_Service SHALL return a message indicating that AI analysis is temporarily unavailable and log the outage event via the Audit_Logger
2. IF the LLM_Provider response contains content that fails safety validation, THEN THE AI_Service SHALL discard the response and return a generic safe message indicating the response could not be completed
3. WHEN the AI_Service experiences consecutive failures exceeding 5 within a 5-minute window, THE AI_Service SHALL activate a circuit breaker and stop sending requests to the LLM_Provider for 60 seconds, after which it SHALL allow a single test request to determine if the LLM_Provider has recovered before fully resuming traffic
4. WHILE the AI_Service is in circuit-breaker state, THE AI_Chat_Interface SHALL remain navigable, display cached conversation history, and show a visible status indicator informing the user that AI responses are temporarily unavailable
5. IF the Context_Builder cannot retrieve market data or portfolio data within 3 seconds, THEN THE AI_Service SHALL proceed with available context and indicate which data sources are currently unavailable in the response
6. WHEN the AI_Service transitions from operational state to circuit-breaker state, THE AI_Chat_Interface SHALL display a notification informing the user that AI features are temporarily degraded and requests will be retried automatically
