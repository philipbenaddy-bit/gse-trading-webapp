import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewsService } from './news.service';
import { NewsAggregatorService } from './news-aggregator.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly newsAggregator: NewsAggregatorService,
  ) {}

  // ==================== NEWS ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create news article' })
  @ApiResponse({ status: 201, description: 'News created successfully' })
  async createNews(@Body() createNewsDto: CreateNewsDto, @Request() req) {
    return this.newsService.createNews(createNewsDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all news with pagination and filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'symbol', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAllNews(
    @Query('category') category?: string,
    @Query('symbol') symbol?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.newsAggregator.getAllNews({ category, symbol, limit, offset });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending news' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingNews(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.newsAggregator.getTrendingNews(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get news by ID' })
  @ApiResponse({ status: 200, description: 'News found' })
  @ApiResponse({ status: 404, description: 'News not found' })
  async getNewsById(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.getNewsById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete news article' })
  @ApiResponse({ status: 200, description: 'News deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the author' })
  @ApiResponse({ status: 404, description: 'News not found' })
  async deleteNews(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.newsService.deleteNews(id, req.user.userId);
  }

  // ==================== COMMENTS ====================

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to news' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async createComment(
    @Param('id', ParseUUIDPipe) newsId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ) {
    return this.newsService.createComment(newsId, req.user.userId, createCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for news' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getComments(
    @Param('id', ParseUUIDPipe) newsId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.newsService.getComments(newsId, { limit, offset });
  }

  @Get('comments/:commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  async getReplies(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.newsService.getReplies(commentId);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the author' })
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req,
  ) {
    return this.newsService.deleteComment(commentId, req.user.userId);
  }

  // ==================== REACTIONS ====================

  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle reaction on news' })
  @ApiResponse({ status: 200, description: 'Reaction toggled successfully' })
  async toggleReaction(
    @Param('id', ParseUUIDPipe) newsId: string,
    @Body() createReactionDto: CreateReactionDto,
    @Request() req,
  ) {
    return this.newsService.toggleReaction(newsId, req.user.userId, createReactionDto);
  }

  @Get(':id/reactions')
  @ApiOperation({ summary: 'Get reactions for news' })
  async getReactions(@Param('id', ParseUUIDPipe) newsId: string) {
    return this.newsService.getReactionsByNews(newsId);
  }

  @Get(':id/reactions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reaction for news' })
  async getUserReaction(
    @Param('id', ParseUUIDPipe) newsId: string,
    @Request() req,
  ) {
    return this.newsService.getUserReaction(newsId, req.user.userId);
  }
}
