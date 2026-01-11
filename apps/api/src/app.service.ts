import { Injectable } from '@nestjs/common';
import { prisma } from '@votebox/database';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'votebox-api',
      version: '0.1.0',
    };
  }

  async getReadiness() {
    const checks = {
      database: false,
      redis: false,
    };

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // TODO: Check Redis connection when Redis module is implemented
    // For now, we'll mark it as true
    checks.redis = true;

    const isReady = checks.database && checks.redis;

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
