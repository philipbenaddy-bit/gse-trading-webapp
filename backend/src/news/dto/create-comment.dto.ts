import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content', example: 'Great news for MTN shareholders!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
