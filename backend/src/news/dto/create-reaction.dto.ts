import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReactionDto {
  @ApiProperty({ 
    description: 'Reaction type', 
    example: '👍',
    enum: ['👍', '📈', '📉', '🔥', '💡']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['👍', '📈', '📉', '🔥', '💡'])
  type: string;
}
