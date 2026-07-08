import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GseService } from '../gse/gse.service';
import { PromptGuardService, GENERIC_REFUSAL_MESSAGE } from './services/prompt-guard.service';
import { ContextBuilderService } from './services/context-builder.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { DisclaimerEngineService } from './services/disclaimer-engine.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { ChatMessage, RateLimitInfo } from './interfaces/ai.interfaces';
import { ChatResponseDto } from './dto/chat.dto';
import { TOKEN_BUDGET_MAX, LLM_TIMEOUT_MS } from './constants/ai.constants';
import { buildSystemPrompt } from './templates/system-prompt.template';

/**
 * Fallback response returned when the LLM is unavailable.
 */
const LLM_FALLBACK_RESPONSE =
  'AI analysis is temporarily unavailable. Your question has been saved and you can try again shortly.';

/**
 * Generic safe message returned when LLM output fails validation.
 */
const UNSAFE_OUTPUT_MESSAGE =
  "I wasn't able to complete that analysis. Please try rephrasing your question.";

/**
 * Patterns that indicate system prompt leakage in LLM output.
 */
const SYSTEM_PROMPT_FRAGMENTS = [
  'SCOPE',
  'STRICTLY FORBIDDEN',
  'RESPONSE GUIDELINES',
  'You ONLY discuss',
  'You must NEVER',
];

/**
 * Regex patterns for API key detection in LLM output.
 */
const API_KEY_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/,
  /key-[a-zA-Z0-9]{20,}/,
  /sk-proj-[a-zA-Z0-9]{20,}/,
  /xai-[a-zA-Z0-9]{20,}/,
];

/**
 * Internal service names that should never appear in LLM output.
 */
const INTERNAL_SERVICE_NAMES = [
  'PromptGuard',
  'ContextBuilder',
  'CircuitBreaker',
  'RateLimiter',
  'ConversationStore',
  'DisclaimerEngine',
  'AuditLogger',
  'NestJS',
  'Supabase',
];

export interface AiInsight {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  summary: string;
  keyPoints: string[];
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
}

export interface PortfolioAnalysis {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  diversificationScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openaiKey: string;
  private readonly anthropicKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly gseService: GseService,
    private readonly promptGuardService: PromptGuardService,
    private readonly contextBuilderService: ContextBuilderService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly conversationStoreService: ConversationStoreService,
    private readonly disclaimerEngineService: DisclaimerEngineService,
    private readonly auditLoggerService: AuditLoggerService,
  ) {
    this.openaiKey = config.get('OPENAI_API_KEY', '');
    this.anthropicKey = config.get('ANTHROPIC_API_KEY', '');
  }

  private get hasAiKey(): boolean {
    return !!(this.openaiKey || this.anthropicKey);
  }

  // ── Main Orchestrator: chat() ───────────────────────────────────────────────

  /**
   * Orchestrates the full AI chat flow:
   * 1. Validate input (PromptGuard sanitize + validate)
   * 2. Check rate limit
   * 3. Detect injection
   * 4. Build context (market, portfolio, news, conversation history)
   * 5. Check circuit breaker
   * 6. Call LLM (with fallback)
   * 7. Validate output safety
   * 8. Persist messages
   * 9. Audit log
   * 10. Attach disclaimer
   * 11. Return response
   */
  async chat(
    userId: string,
    message: string,
    conversationId?: string,
  ): Promise<ChatResponseDto> {
    const startTime = Date.now();

    // ── Step 1: Sanitize and validate input ─────────────────────────────────
    const { sanitized, valid, injectionDetected, error: guardError } =
      this.promptGuardService.processInput(message, conversationId || userId);

    if (!valid && !injectionDetected) {
      // Input validation failure (length, etc.)
      throw new Error(guardError || 'Invalid input');
    }

    if (injectionDetected) {
      // Log security event and return generic refusal
      await this.auditLoggerService.logSecurityEvent({
        userId,
        sanitizedInput: sanitized,
        detectionReason: 'prompt_injection',
      });
      await this.auditLoggerService.logInteraction({
        userId,
        requestType: 'chat',
        tokenCount: 0,
        responseStatus: 'rejected',
        durationMs: Date.now() - startTime,
      });

      const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);
      return {
        conversationId: conversationId || '',
        messageId: '',
        reply: GENERIC_REFUSAL_MESSAGE,
        disclaimer: this.disclaimerEngineService.getDisclaimer(),
        rateLimitInfo,
        dataSources: [],
      };
    }

    // ── Step 2: Check rate limit ────────────────────────────────────────────
    const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);
    if (rateLimitInfo.limitExceeded) {
      await this.auditLoggerService.logInteraction({
        userId,
        requestType: 'chat',
        tokenCount: 0,
        responseStatus: 'rate_limited',
        durationMs: Date.now() - startTime,
      });
      throw new RateLimitExceededError(rateLimitInfo);
    }

    // ── Step 3: Get or create conversation ──────────────────────────────────
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conversation = await this.conversationStoreService.createConversation(
        userId,
        this.generateConversationTitle(sanitized),
      );
      activeConversationId = conversation.id;
    }

    // ── Step 4: Persist user message ────────────────────────────────────────
    const userTokenCount = this.estimateTokenCount(sanitized);
    await this.conversationStoreService.addMessage(
      activeConversationId,
      'user',
      sanitized,
      userTokenCount,
    );

    // ── Step 5: Build context ───────────────────────────────────────────────
    const dataSources: string[] = [];
    const unavailableSources: string[] = [];

    const extractedSymbols = this.contextBuilderService.extractStockSymbols(sanitized);

    // Build market context
    let marketContext;
    try {
      marketContext = await this.contextBuilderService.buildMarketContext(sanitized);
      if (marketContext) dataSources.push('market_data');
      else unavailableSources.push('market_data');
    } catch {
      unavailableSources.push('market_data');
    }

    // Build portfolio context (assume KYC verified for now; controller should pass this)
    let portfolioContext;
    try {
      portfolioContext = await this.contextBuilderService.buildPortfolioContext(userId, true);
      if (portfolioContext) dataSources.push('portfolio');
    } catch {
      unavailableSources.push('portfolio');
    }

    // Build news context
    let newsContext;
    try {
      const isSentimentQuery = this.isSentimentQuery(sanitized);
      newsContext = await this.contextBuilderService.buildNewsContext(
        extractedSymbols,
        isSentimentQuery,
      );
      if (newsContext) dataSources.push('news');
    } catch {
      unavailableSources.push('news');
    }

    // Get conversation history for context window
    const conversationHistory =
      await this.conversationStoreService.getContextWindow(activeConversationId);

    // ── Step 6: Assemble LLM messages ───────────────────────────────────────
    const systemPrompt = buildSystemPrompt({ currentDate: new Date().toISOString() });
    const contextBlock = this.buildContextBlock(
      marketContext,
      portfolioContext,
      newsContext,
      unavailableSources,
    );

    const messages: ChatMessage[] = [
      { role: 'system', content: `${systemPrompt}\n\n${contextBlock}` },
      ...conversationHistory.slice(0, -1), // exclude the just-added user message (it's already in history)
      { role: 'user', content: sanitized },
    ];

    // ── Step 7: Call LLM via circuit breaker ─────────────────────────────────
    let llmResponse: string;
    let responseStatus: 'success' | 'error' | 'timeout' = 'success';

    try {
      llmResponse = await this.callLLM(messages, TOKEN_BUDGET_MAX);
    } catch (err) {
      responseStatus = err.message?.includes('timeout') ? 'timeout' : 'error';
      llmResponse = LLM_FALLBACK_RESPONSE;

      // Don't count failed requests against rate limit
      // (user message is already persisted — requirement 1.6)
    }

    // ── Step 8: Validate LLM output ─────────────────────────────────────────
    if (responseStatus === 'success' && !this.validateOutput(llmResponse)) {
      this.logger.warn('LLM output failed safety validation, returning safe message');
      llmResponse = UNSAFE_OUTPUT_MESSAGE;
      responseStatus = 'error';
    }

    // ── Step 9: Report unavailable data sources in response ─────────────────
    if (unavailableSources.length > 0 && responseStatus === 'success') {
      const sourceNotes = unavailableSources.map((source) => {
        switch (source) {
          case 'market_data':
            return 'Note: Current market data is temporarily unavailable.';
          case 'portfolio':
            return 'Note: Portfolio data could not be loaded.';
          case 'news':
            return 'Note: Recent news data is not available.';
          default:
            return `Note: ${source} is temporarily unavailable.`;
        }
      });
      llmResponse = `${llmResponse}\n\n${sourceNotes.join('\n')}`;
    }

    // ── Step 10: Persist assistant message ──────────────────────────────────
    const assistantTokenCount = this.estimateTokenCount(llmResponse);
    const assistantMessage = await this.conversationStoreService.addMessage(
      activeConversationId,
      'assistant',
      llmResponse,
      assistantTokenCount,
    );

    // ── Step 11: Record rate limit (only on success) ────────────────────────
    if (responseStatus === 'success') {
      await this.rateLimiterService.recordRequest(userId);
    }

    // ── Step 12: Audit log ──────────────────────────────────────────────────
    await this.auditLoggerService.logInteraction({
      userId,
      requestType: 'chat',
      tokenCount: userTokenCount + assistantTokenCount,
      responseStatus,
      durationMs: Date.now() - startTime,
    });

    // ── Step 13: Attach disclaimer and respond ──────────────────────────────
    const updatedRateLimitInfo = await this.rateLimiterService.checkLimit(userId);

    return {
      conversationId: activeConversationId,
      messageId: assistantMessage.id,
      reply: llmResponse,
      disclaimer: this.disclaimerEngineService.getDisclaimer(),
      rateLimitInfo: updatedRateLimitInfo,
      dataSources,
    };
  }

  // ── LLM Call with Circuit Breaker and Dual Provider ─────────────────────────

  /**
   * Calls the LLM with circuit breaker protection and dual-provider fallback.
   * Flow:
   * 1. Check circuit breaker — if open, throw immediately
   * 2. Try OpenAI GPT-4o-mini (primary) with 5-second timeout
   * 3. On failure, try Anthropic Claude 3 Haiku (fallback) with 5-second timeout
   * 4. Record success/failure with circuit breaker
   * 5. Enforce TOKEN_BUDGET_MAX (4000 tokens)
   */
  async callLLM(messages: ChatMessage[], maxTokens: number = TOKEN_BUDGET_MAX): Promise<string> {
    // Check circuit breaker first
    const canExecute = await this.circuitBreakerService.canExecute();
    if (!canExecute) {
      this.logger.warn('Circuit breaker is open, rejecting LLM call');
      throw new Error('Circuit breaker open: LLM service unavailable');
    }

    // Enforce token budget cap
    const effectiveMaxTokens = Math.min(maxTokens, TOKEN_BUDGET_MAX);

    // If no API keys configured, use fallback
    if (!this.hasAiKey) {
      return this.generateFallbackResponse(messages);
    }

    // Try primary provider: OpenAI GPT-4o-mini
    if (this.openaiKey) {
      try {
        const response = await this.callOpenAI(messages, effectiveMaxTokens);
        await this.circuitBreakerService.recordSuccess();
        return response;
      } catch (primaryError) {
        this.logger.warn(`OpenAI call failed: ${primaryError.message}`);
        // Fall through to Anthropic fallback
      }
    }

    // Try fallback provider: Anthropic Claude 3 Haiku
    if (this.anthropicKey) {
      try {
        const response = await this.callAnthropic(messages, effectiveMaxTokens);
        await this.circuitBreakerService.recordSuccess();
        return response;
      } catch (fallbackError) {
        this.logger.error(`Anthropic fallback also failed: ${fallbackError.message}`);
      }
    }

    // Both providers failed — record failure with circuit breaker
    await this.circuitBreakerService.recordFailure();
    throw new Error('LLM call failed: all providers unavailable');
  }

  private async callOpenAI(messages: ChatMessage[], maxTokens: number): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: LLM_TIMEOUT_MS,
      },
    );
    return response.data.choices[0].message.content;
  }

  private async callAnthropic(messages: ChatMessage[], maxTokens: number): Promise<string> {
    const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: maxTokens,
        system: systemMsg,
        messages: userMessages,
      },
      {
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: LLM_TIMEOUT_MS,
      },
    );
    return response.data.content[0].text;
  }

  // ── Output Validation ───────────────────────────────────────────────────────

  /**
   * Validates LLM output for safety. Rejects responses containing:
   * - System prompt fragments (e.g., "SCOPE", "STRICTLY FORBIDDEN", "RESPONSE GUIDELINES")
   * - API key patterns (e.g., sk-..., key-...)
   * - Internal service names (e.g., "PromptGuard", "ContextBuilder", "NestJS")
   *
   * Returns true if the output is safe, false if it should be rejected.
   */
  validateOutput(response: string): boolean {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Check for system prompt fragments
    for (const fragment of SYSTEM_PROMPT_FRAGMENTS) {
      if (response.includes(fragment)) {
        this.logger.warn(`Output validation failed: contains system prompt fragment "${fragment}"`);
        return false;
      }
    }

    // Check for API key patterns
    for (const pattern of API_KEY_PATTERNS) {
      if (pattern.test(response)) {
        this.logger.warn('Output validation failed: contains API key pattern');
        return false;
      }
    }

    // Check for internal service names
    for (const serviceName of INTERNAL_SERVICE_NAMES) {
      if (response.includes(serviceName)) {
        this.logger.warn(`Output validation failed: contains internal service name "${serviceName}"`);
        return false;
      }
    }

    return true;
  }

  // ── Helper Methods ──────────────────────────────────────────────────────────

  /**
   * Builds a context block string from assembled data for the LLM prompt.
   */
  private buildContextBlock(
    marketData: any,
    portfolioData: any,
    newsData: any,
    unavailableSources: string[],
  ): string {
    const sections: string[] = [];

    if (marketData) {
      let marketSection = 'MARKET DATA:\n';
      if (marketData.requestedStock) {
        const s = marketData.requestedStock;
        marketSection += `Requested Stock: ${s.symbol} — Price: GHS ${s.price}, Change: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%, Volume: ${s.volume}\n`;
      }
      if (marketData.compositeIndex !== undefined) {
        marketSection += `GSE Composite Index: ${marketData.compositeIndex}\n`;
      }
      if (marketData.topGainers?.length > 0) {
        marketSection += `Top Gainers: ${marketData.topGainers.map((g: any) => `${g.symbol} (+${g.changePercent}%)`).join(', ')}\n`;
      }
      if (marketData.topLosers?.length > 0) {
        marketSection += `Top Losers: ${marketData.topLosers.map((l: any) => `${l.symbol} (${l.changePercent}%)`).join(', ')}\n`;
      }
      marketSection += `Last Updated: ${marketData.lastUpdated}`;
      sections.push(marketSection);
    }

    if (portfolioData) {
      let portfolioSection = 'PORTFOLIO DATA:\n';
      portfolioSection += `Total Value: GHS ${portfolioData.totalValue.toFixed(2)}, Total P&L: GHS ${portfolioData.totalPnl.toFixed(2)}\n`;
      portfolioSection += `Holdings (${portfolioData.holdings.length}):\n`;
      for (const h of portfolioData.holdings.slice(0, 10)) {
        portfolioSection += `  ${h.symbol}: ${h.quantity} shares, Value: GHS ${h.currentValue.toFixed(2)}, P&L: GHS ${h.unrealizedGainLoss.toFixed(2)}\n`;
      }
      sections.push(portfolioSection);
    }

    if (newsData?.articles?.length > 0) {
      let newsSection = 'RECENT NEWS:\n';
      for (const article of newsData.articles) {
        newsSection += `- "${article.title}" (${article.source}, ${article.publishedAt})\n  ${article.summary}\n`;
      }
      sections.push(newsSection);
    }

    if (unavailableSources.length > 0) {
      sections.push(`UNAVAILABLE DATA SOURCES: ${unavailableSources.join(', ')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Generates a conversation title from the first user message.
   */
  private generateConversationTitle(message: string): string {
    const maxLength = 50;
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Estimates token count for a string (rough approximation: ~4 chars per token).
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Determines if a message is a sentiment/market trend query.
   */
  private isSentimentQuery(message: string): boolean {
    const sentimentKeywords = [
      'sentiment', 'trend', 'trending', 'market mood',
      'bullish', 'bearish', 'outlook', 'forecast',
    ];
    const lower = message.toLowerCase();
    return sentimentKeywords.some((kw) => lower.includes(kw));
  }

  /**
   * Generates a fallback response when no API keys are configured.
   */
  private generateFallbackResponse(messages: ChatMessage[]): string {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

    if (lastMsg.includes('portfolio')) {
      return 'Your portfolio shows a diversified mix of equities. Consider reviewing your sector allocation and ensuring you\'re not over-concentrated in any single stock. Regular rebalancing helps manage risk effectively.';
    }
    if (lastMsg.includes('buy') || lastMsg.includes('sell')) {
      return 'Trading decisions should be based on thorough research, including fundamental analysis, technical indicators, and your personal risk tolerance. Always consider the broader market context before executing trades.';
    }
    if (lastMsg.includes('market') || lastMsg.includes('gse')) {
      return 'The Ghana Stock Exchange offers opportunities across banking, telecom, and energy sectors. Monitor volume trends and price movements alongside company fundamentals for informed decisions.';
    }
    return "I'm your AI trading assistant. I can help analyze your portfolio, discuss market trends, and provide insights on specific stocks. What would you like to explore today?";
  }

  // ── Legacy Methods (preserved for backward compatibility) ───────────────────

  /**
   * Legacy chat method for backward compatibility with existing controller.
   * @deprecated Use the new chat(userId, message, conversationId?) method instead.
   */
  async legacyChat(
    message: string,
    history: ChatMessage[],
    userId: string,
  ): Promise<string> {
    const liveStocks = this.gseService.getAllLive().slice(0, 10);
    const marketContext = liveStocks
      .map((s) => `${s.name}: GHS ${s.price} (${s.change >= 0 ? '+' : ''}${s.change})`)
      .join(', ');

    const systemPrompt = `You are an expert AI trading assistant for a stock trading platform focused on the Ghana Stock Exchange (GSE). 
You provide concise, actionable insights about stocks, portfolio management, and market trends.
Current market snapshot: ${marketContext}
Keep responses under 200 words. Be direct and professional. Format key numbers clearly.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    return this.callLLM(messages, 300);
  }

  /**
   * Gets AI insight for a specific stock symbol.
   */
  async getStockInsight(symbol: string): Promise<AiInsight> {
    try {
      const live = this.gseService.getLiveBySymbol(symbol);
      const equity = this.gseService.getEquityBySymbol(symbol);

      if (!live) {
        return this.buildFallbackInsight(symbol);
      }

      const prompt = `Analyze this GSE stock briefly:
Symbol: ${symbol}
Price: GHS ${live.price}
Change: ${live.change >= 0 ? '+' : ''}${live.change}
Volume: ${live.volume}
${equity?.company?.sector ? `Sector: ${equity.company.sector}` : ''}
${equity?.eps ? `EPS: ${equity.eps}` : ''}
${equity?.dps ? `DPS: ${equity.dps}` : ''}

Respond in JSON only:
{
  "sentiment": "bullish|bearish|neutral",
  "score": <-1 to 1>,
  "summary": "<2 sentences>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "recommendation": "buy|sell|hold",
  "confidence": <0-100>
}`;

      try {
        const raw = await this.callLLM([{ role: 'user', content: prompt }], 256);
        const json = raw.match(/\{[\s\S]*\}/)?.[0];
        if (!json) throw new Error('No JSON in response');
        const parsed = JSON.parse(json);
        if (!parsed.sentiment || !parsed.recommendation) throw new Error('Invalid response shape');
        return { symbol, ...parsed };
      } catch {
        return this.buildFallbackInsight(symbol, live);
      }
    } catch (err) {
      this.logger.error(`getStockInsight failed for ${symbol}`, err);
      return this.buildFallbackInsight(symbol);
    }
  }

  private buildFallbackInsight(symbol: string, live?: any): AiInsight {
    const change = live?.change ?? 0;
    const sentiment = change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
    return {
      symbol,
      sentiment,
      score: Math.max(-1, Math.min(1, change / 5)),
      summary: `${symbol} is currently trading at GHS ${live?.price ?? 'N/A'} with a ${change >= 0 ? 'positive' : 'negative'} movement today. Monitor volume for confirmation of trend direction.`,
      keyPoints: [
        `Price: GHS ${live?.price ?? 'N/A'}`,
        `Daily change: ${change >= 0 ? '+' : ''}${change}`,
        `Volume: ${live?.volume?.toLocaleString() ?? 'N/A'}`,
      ],
      recommendation: change > 1 ? 'buy' : change < -1 ? 'sell' : 'hold',
      confidence: 55,
    };
  }

  /**
   * Gets news sentiment analysis for a stock.
   */
  async getNewsSentiment(
    symbol: string,
    headlines: string[],
  ): Promise<{ sentiment: string; score: number; summary: string }> {
    if (!headlines.length) {
      return { sentiment: 'neutral', score: 0, summary: 'No recent news available.' };
    }

    const bullishWords = ['growth', 'profit', 'gain', 'rise', 'surge', 'strong', 'positive', 'record', 'dividend', 'expansion', 'beat', 'exceed'];
    const bearishWords = ['loss', 'decline', 'fall', 'drop', 'weak', 'negative', 'miss', 'cut', 'reduce', 'concern', 'risk', 'debt'];

    let score = 0;
    const text = headlines.join(' ').toLowerCase();
    bullishWords.forEach((w) => { if (text.includes(w)) score += 0.15; });
    bearishWords.forEach((w) => { if (text.includes(w)) score -= 0.15; });
    score = Math.max(-1, Math.min(1, score));

    const sentiment = score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral';

    if (this.hasAiKey && headlines.length > 0) {
      try {
        const prompt = `Analyze sentiment for ${symbol} from these headlines: ${headlines.slice(0, 5).join('; ')}. 
Reply in JSON: {"sentiment":"bullish|bearish|neutral","score":<-1 to 1>,"summary":"<1 sentence>"}`;
        const raw = await this.callLLM([{ role: 'user', content: prompt }], 150);
        const json = raw.match(/\{[\s\S]*\}/)?.[0];
        if (json) return JSON.parse(json);
      } catch {
        // fall through to keyword result
      }
    }

    return {
      sentiment,
      score: parseFloat(score.toFixed(2)),
      summary: `News sentiment for ${symbol} is ${sentiment} based on ${headlines.length} recent articles.`,
    };
  }

  /**
   * Analyzes a user's portfolio using AI.
   */
  async analyzePortfolio(holdings: any[], summary: any): Promise<PortfolioAnalysis> {
    if (!holdings.length) {
      return {
        overallHealth: 'fair',
        score: 50,
        summary: 'Your portfolio is empty. Start by investing in diversified GSE stocks.',
        strengths: [],
        risks: ['No holdings — no market exposure'],
        suggestions: ['Consider starting with blue-chip GSE stocks', 'Diversify across sectors'],
        diversificationScore: 0,
        riskLevel: 'low',
      };
    }

    const totalValue = summary?.totalValue || 1;
    const maxAllocation = Math.max(...holdings.map((h) => h.currentValue / totalValue));
    const diversificationScore = Math.round((1 - maxAllocation) * 100);

    const holdingsSummary = holdings
      .map((h) => `${h.symbol}: ${h.quantity} shares @ GHS ${h.currentPrice}, P&L: ${h.pnlPercent}%`)
      .join('\n');

    const prompt = `Analyze this stock portfolio:
${holdingsSummary}
Total Value: GHS ${totalValue.toFixed(2)}
Total P&L: ${summary?.totalPnlPercent?.toFixed(2)}%

Respond in JSON only:
{
  "overallHealth": "excellent|good|fair|poor",
  "score": <0-100>,
  "summary": "<2-3 sentences>",
  "strengths": ["<s1>", "<s2>"],
  "risks": ["<r1>", "<r2>"],
  "suggestions": ["<sug1>", "<sug2>", "<sug3>"],
  "riskLevel": "low|medium|high"
}`;

    try {
      const raw = await this.callLLM([{ role: 'user', content: prompt }], 400);
      const json = raw.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('No JSON');
      const parsed = JSON.parse(json);
      return { ...parsed, diversificationScore };
    } catch {
      return this.buildFallbackPortfolioAnalysis(holdings, summary, diversificationScore);
    }
  }

  private buildFallbackPortfolioAnalysis(
    holdings: any[],
    summary: any,
    diversificationScore: number,
  ): PortfolioAnalysis {
    const pnl = summary?.totalPnlPercent ?? 0;
    const score = Math.min(100, Math.max(0, 50 + pnl * 2 + diversificationScore * 0.3));
    const health = score >= 75 ? 'excellent' : score >= 55 ? 'good' : score >= 35 ? 'fair' : 'poor';

    return {
      overallHealth: health,
      score: Math.round(score),
      summary: `Your portfolio of ${holdings.length} stocks has a total P&L of ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%. ${diversificationScore > 60 ? 'Good diversification across holdings.' : 'Consider diversifying further.'}`,
      strengths: [
        holdings.length > 3 ? 'Multiple holdings reduce single-stock risk' : 'Active portfolio management',
        pnl > 0 ? `Positive overall return of +${pnl.toFixed(2)}%` : 'Positions established for future growth',
      ],
      risks: [
        diversificationScore < 40 ? 'High concentration in few stocks' : 'Monitor sector concentration',
        'Market volatility may impact short-term performance',
      ],
      suggestions: [
        'Review underperforming positions quarterly',
        'Consider adding defensive stocks for balance',
        'Set stop-loss levels to protect gains',
      ],
      diversificationScore,
      riskLevel: diversificationScore < 30 ? 'high' : diversificationScore < 60 ? 'medium' : 'low',
    };
  }
}

/**
 * Custom error class for rate limit exceeded scenarios.
 */
export class RateLimitExceededError extends Error {
  constructor(public readonly rateLimitInfo: RateLimitInfo) {
    const limitType = rateLimitInfo.limitExceeded === 'hourly' ? 'hourly' : 'daily';
    const limit = limitType === 'hourly' ? 30 : 100;
    super(
      `You've reached the ${limitType} limit of ${limit} AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`,
    );
    this.name = 'RateLimitExceededError';
  }
}
