import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered email address of the user.',
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
}
