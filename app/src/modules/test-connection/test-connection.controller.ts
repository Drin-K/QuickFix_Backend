import { Controller, Get } from '@nestjs/common';
import { TestConnectionService } from './test-connection.service';

@Controller('test-connection')
export class TestConnectionController {
  constructor(private readonly testConnectionService: TestConnectionService) {}

  @Get()
  checkFrontendConnection() {
    return this.testConnectionService.checkFrontendConnection();
  }
}
