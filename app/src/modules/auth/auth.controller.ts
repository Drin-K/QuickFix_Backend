import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a new client or provider account and returns a JWT bearer token for immediate authenticated access.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'Account created successfully.',
    schema: {
      example: {
        message: 'User registered successfully',
        accessToken: '<jwt-token>',
        user: {
          id: 1,
          email: 'john@example.com',
          fullName: 'John Doe',
          role: 'provider',
          tenantId: 3,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for one or more required fields.',
  })
  @ApiConflictResponse({
    description: 'A user with the provided email already exists.',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'Validates user credentials and returns a JWT bearer token plus the current user context.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login completed successfully.',
    schema: {
      example: {
        message: 'Login successful',
        accessToken: '<jwt-token>',
        user: {
          id: 4,
          email: 'user@example.com',
          fullName: 'John Doe',
          role: 'client',
          tenantId: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for email or password.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
