import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('db')
  @ApiOperation({
    summary: 'Check database health',
    description:
      'Runs a simple database query to verify that the backend can reach the database.',
  })
  @ApiOkResponse({
    description: 'Database connection is healthy.',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Database is unavailable.',
    schema: {
      example: {
        statusCode: 503,
        message: {
          status: 'error',
          database: 'disconnected',
        },
      },
    },
  })
  checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
