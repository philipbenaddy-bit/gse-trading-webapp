import { IsEmail, IsString, MinLength, IsPhoneNumber, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Kofi' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Mensah' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'kofi@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+233241234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  password: string;
}
