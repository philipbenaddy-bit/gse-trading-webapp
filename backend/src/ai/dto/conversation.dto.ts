import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents a single conversation summary in the list.
 */
export class ConversationSummaryDto {
  @ApiProperty({
    description: 'Unique conversation identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation title (auto-generated or user-defined)',
    example: 'MTN Ghana price discussion',
  })
  title: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the last message in the conversation',
    example: '2024-06-15T14:30:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Total number of messages in the conversation',
    example: 12,
  })
  messageCount: number;
}

/**
 * DTO for the list of user conversations returned by GET /api/v1/ai/conversations.
 */
export class ConversationListDto {
  @ApiProperty({
    description: 'Array of conversation summaries sorted by most recent',
    type: [ConversationSummaryDto],
  })
  conversations: ConversationSummaryDto[];
}
