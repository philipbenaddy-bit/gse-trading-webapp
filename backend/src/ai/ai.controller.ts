import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { InsightGeneratorService } from './services/insight-generator.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';
import { ChatDto, SentimentDto, SendMessageDto, ChatResponseDto } from './dto/chat.dto';
import { DisclaimerEngineService } from './services/disclaimer-engine.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly conversationStoreService: ConversationStoreService,
    private readonly insightGeneratorService: InsightGeneratorService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly portfolioService: PortfolioService,
    private readonly disclaimerEngine: DisclaimerEngineService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // AI Market Intelligence Endpoints
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/v1/ai/chat — Send a message to the AI assistant.
   * Optionally provide a conversationId to continue an existing thread.
   * If no conversationId is provided, a new conversation is created.
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the AI trading assistant' })
  @ApiResponse({ status: 200, description: 'AI response with disclaimer', type: ChatResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req,
  ): Promise<ChatResponseDto> {
    const userId = req.user.id || req.user.sub;

    // Verify conversation ownership if conversationId is provided
    if (dto.conversationId) {
      const existing = await this.conversationStoreService.getConversation(dto.conversationId, userId);
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
    }

    // Delegate to the orchestrator which handles the full flow:
    // validate → rate limit → sanitize → build context → circuit breaker → LLM → validate output → persist → audit → disclaimer
    return this.aiService.chat(userId, dto.message, dto.conversationId);
  }

  /**
   * POST /api/v1/ai/conversations — Create a new conversation thread.
   */
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new AI conversation thread' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(@Request() req) {
    const userId = req.user.id || req.user.sub;
    const conversation = await this.conversationStoreService.createConversation(userId);
    return conversation;
  }

  /**
   * GET /api/v1/ai/conversations — List user's conversations sorted by most recent.
   */
  @Get('conversations')
  @ApiOperation({ summary: "List user's AI conversations" })
  @ApiResponse({ status: 200, description: 'List of conversations sorted by most recent' })
  async listConversations(@Request() req) {
    const userId = req.user.id || req.user.sub;
    const conversations = await this.conversationStoreService.listConversations(userId);
    return { conversations };
  }

  /**
   * GET /api/v1/ai/conversations/:id — Get full conversation history.
   */
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get full conversation history' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 200, description: 'Conversation with full message history' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.sub;
    const conversation = await this.conversationStoreService.getConversation(id, userId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const messages = await this.conversationStoreService.getMessages(id);

    return {
      ...conversation,
      messages,
    };
  }

  /**
   * DELETE /api/v1/ai/conversations/:id — Request conversation deletion (soft-delete).
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation (soft-delete)' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiResponse({ status: 204, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.sub;

    // Verify the conversation exists and belongs to this user
    const conversation = await this.conversationStoreService.getConversation(id, userId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.conversationStoreService.deleteConversation(id, userId);
  }

  /**
   * GET /api/v1/ai/insights — Get dashboard insight cards for the user.
   */
  @Get('insights')
  @ApiOperation({ summary: 'Get AI-generated dashboard insight cards' })
  @ApiResponse({ status: 200, description: 'Array of insight cards or null if unavailable' })
  async getInsights(@Request() req) {
    const userId = req.user.id || req.user.sub;

    // Get user's portfolio holdings for context
    let holdings = [];
    try {
      const portfolio = await this.portfolioService.getUserPortfolio(userId);
      holdings = portfolio.holdings || [];
    } catch {
      // Portfolio unavailable — generate insights without holdings
    }

    const insights = await this.insightGeneratorService.getInsights(userId, holdings);
    return { insights: insights || [] };
  }

  /**
   * GET /api/v1/ai/status — Get AI service status (circuit breaker state).
   */
  @Get('status')
  @ApiOperation({ summary: 'Get AI service status and circuit breaker state' })
  @ApiResponse({ status: 200, description: 'Current circuit breaker state' })
  async getStatus() {
    const state = await this.circuitBreakerService.getState();
    return state;
  }

  /**
   * GET /api/v1/ai/rate-limit — Get current rate limit status for the user.
   */
  @Get('rate-limit')
  @ApiOperation({ summary: 'Get current rate limit status' })
  @ApiResponse({ status: 200, description: 'Current rate limit info for the user' })
  async getRateLimit(@Request() req) {
    const userId = req.user.id || req.user.sub;
    const rateLimitInfo = await this.rateLimiterService.getRateLimitStatus(userId);
    return rateLimitInfo;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Legacy Endpoints (preserved for backward compatibility)
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/v1/ai/legacy-chat — Legacy chat endpoint (backward compatibility).
   * @deprecated Use POST /api/v1/ai/chat with SendMessageDto instead.
   */
  @Post('legacy-chat')
  @ApiOperation({ summary: '[Legacy] Chat with AI trading assistant' })
  async legacyChat(@Body() dto: ChatDto, @Request() req) {
    const reply = await this.aiService.legacyChat(
      dto.message,
      dto.history || [],
      req.user.id,
    );
    return { reply };
  }

  /**
   * GET /api/v1/ai/insights/:symbol — Legacy stock insight endpoint.
   */
  @Get('insights/:symbol')
  @ApiOperation({ summary: 'Get AI insight for a specific stock' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol (e.g., MTNGH)' })
  async getStockInsight(@Param('symbol') symbol: string) {
    return this.aiService.getStockInsight(symbol.toUpperCase());
  }

  /**
   * POST /api/v1/ai/sentiment/:symbol — News sentiment analysis.
   */
  @Post('sentiment/:symbol')
  @ApiOperation({ summary: 'Analyze news sentiment for a symbol' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol (e.g., MTNGH)' })
  async getSentiment(
    @Param('symbol') symbol: string,
    @Body() dto: SentimentDto,
  ) {
    return this.aiService.getNewsSentiment(symbol.toUpperCase(), dto.headlines);
  }

  /**
   * GET /api/v1/ai/portfolio-analysis — AI portfolio analysis.
   */
  @Get('portfolio-analysis')
  @ApiOperation({ summary: 'Get AI analysis of user portfolio' })
  async analyzePortfolio(@Request() req) {
    const portfolio = await this.portfolioService.getUserPortfolio(req.user.id);
    return this.aiService.analyzePortfolio(portfolio.holdings, portfolio.summary);
  }
}
