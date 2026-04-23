import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    minLength: 2,
    description: 'Full name of the user or provider account owner.',
  })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address used for authentication.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'secret123',
    minLength: 6,
    description: 'Account password. Must be at least 6 characters long.',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    enum: ['client', 'provider'],
    example: 'client',
    description: 'Determines whether the user registers as a client or a provider.',
  })
  @IsIn(['client', 'provider'])
  accountType!: 'client' | 'provider';
}
