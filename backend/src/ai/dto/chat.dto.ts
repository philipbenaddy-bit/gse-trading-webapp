import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RateLimitInfo } from '../interfaces/ai.interfaces';

// ── Legacy DTOs (preserved for backward compatibility) ──────────────────────

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

export class ChatDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ type: [ChatMessageDto], required: false })
  @IsArray()
  @IsOptional()
  history?: ChatMessageDto[];
}

export class SentimentDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  headlines: string[];
}

// ── AI Market Intelligence DTOs ─────────────────────────────────────────────

/**
 * DTO for sending a message to the AI chat.
 * Validates message length (1–1000 chars) and optional conversation ID.
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'User message to send to the AI assistant',
    minLength: 1,
    maxLength: 1000,
    example: 'What is the current price of MTN Ghana?',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({
    description: 'UUID of an existing conversation to continue. Omit to start a new conversation.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;
}

/**
 * DTO for the AI chat response returned to the client.
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'UUID of the conversation this message belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'UUID of the AI response message',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  messageId: string;

  @ApiProperty({
    description: 'The AI-generated reply text',
    example: 'MTN Ghana (MTNGH) is currently trading at GHS 1.25, up 2.5% today.',
  })
  reply: string;

  @ApiProperty({
    description: 'Financial disclaimer appended to the response',
    example: 'This information is for educational purposes only and does not constitute investment advice.',
  })
  disclaimer: string;

  @ApiProperty({
    description: 'Current rate limit status for the user',
    example: {
      hourlyRemaining: 28,
      dailyRemaining: 95,
      resetInSeconds: 3200,
      limitExceeded: null,
    },
  })
  rateLimitInfo: RateLimitInfo;

  @ApiProperty({
    description: 'List of data sources used to generate the response',
    type: [String],
    example: ['market_data', 'news'],
  })
  dataSources: string[];
}
