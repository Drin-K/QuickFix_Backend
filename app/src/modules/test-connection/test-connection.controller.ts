import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TestConnectionService } from './test-connection.service';

@ApiTags('Test Connection')
@Controller('test-connection')
export class TestConnectionController {
  constructor(private readonly testConnectionService: TestConnectionService) {}

  @Get()
  @ApiOperation({
    summary: 'Check frontend-backend connectivity',
    description:
      'Verifies the backend is reachable and that the database connection is still available.',
  })
  @ApiOkResponse({
    description: 'Backend responded successfully.',
    schema: {
      example: {
        message: 'Connected',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Database connection failed while checking connectivity.',
    schema: {
      example: {
        statusCode: 503,
        message: {
          message: 'Database connection failed',
        },
      },
    },
  })
  checkFrontendConnection() {
    return this.testConnectionService.checkFrontendConnection();
  }
}
