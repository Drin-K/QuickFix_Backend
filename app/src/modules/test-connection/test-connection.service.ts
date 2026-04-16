import { Injectable, OnApplicationBootstrap, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TestConnectionService implements OnApplicationBootstrap {
  private frontendConnectionLogged = false;
  private readonly frontendConnectionTimeoutMs = 5000;

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      await this.dataSource.query('SELECT 1');
      console.log('Backend connected with Database');
    } catch {
      console.log('Backend failed to connect with Database');
    }

    setTimeout(() => {
      if (!this.frontendConnectionLogged) {
        console.log('Frontend not connected with Backend yet');
      }
    }, this.frontendConnectionTimeoutMs);
  }

  async checkFrontendConnection() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        message: 'Database connection failed',
      });
    }

    if (!this.frontendConnectionLogged) {
      console.log('Frontend connected with Backend');
      this.frontendConnectionLogged = true;
    }

    return {
      message: 'Connected',
    };
  }
}
