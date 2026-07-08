import { IsString, IsNotEmpty, IsOptional, IsUrl, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ description: 'News title', example: 'MTN Ghana Reports Strong Q4 Earnings' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'News content', example: 'MTN Ghana has announced...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'News summary/excerpt', example: 'MTN Ghana posts 15% revenue growth' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  summary?: string;

  @ApiPropertyOptional({ description: 'Source of the news', example: 'Ghana Stock Exchange' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Source URL', example: 'https://gse.com.gh/news/123' })
  @IsUrl()
  @IsOptional()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Image URL', example: 'https://example.com/image.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Related stock symbols', example: ['MTNGH', 'GCB'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  relatedSymbols?: string[];

  @ApiPropertyOptional({ description: 'News category', example: 'earnings' })
  @IsString()
  @IsOptional()
  category?: string;
}
