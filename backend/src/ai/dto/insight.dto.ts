import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a single AI-generated insight card displayed on the dashboard.
 * Enforces format constraints: title ≤ 80 chars, summary ≤ 150 chars.
 */
export class InsightCardDto {
  @ApiProperty({
    description: 'Unique identifier for the insight card',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    description: 'Insight card title (max 80 characters)',
    maxLength: 80,
    example: 'MTN Ghana shows strong momentum',
  })
  title: string;

  @ApiProperty({
    description: 'Brief summary of the insight (max 150 characters)',
    maxLength: 150,
    example: 'MTNGH has gained 5.2% this week on increased trading volume following Q2 earnings.',
  })
  summary: string;

  @ApiProperty({
    description: 'Stock symbol or market event indicator this insight relates to',
    example: 'MTNGH',
  })
  relevanceSymbol: string;

  @ApiProperty({
    description: 'Financial disclaimer for the insight',
    example: 'This information is for educational purposes only and does not constitute investment advice.',
  })
  disclaimer: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the insight was generated',
    example: '2024-06-15T10:00:00.000Z',
  })
  generatedAt: string;
}
