/**
 * System Logging Category
 * 
 * Handles system-level logging events
 */

import winston from 'winston';
import { sanitizeLogData } from '../utils';

export class SystemLogger {
  constructor(private logger: winston.Logger) {}

  startup(config: any) {
    this.logger.info('Application started', {
      category: 'system',
      event: 'application_startup',
      config: sanitizeLogData(config)
    });
  }

  shutdown(reason?: string) {
    this.logger.info('Application shutting down', {
      category: 'system',
      event: 'application_shutdown',
      reason
    });
  }

  configurationChanged(key: string, oldValue: any, newValue: any) {
    this.logger.info('Configuration changed', {
      category: 'system',
      event: 'configuration_changed',
      key,
      oldValue: sanitizeLogData(oldValue),
      newValue: sanitizeLogData(newValue)
    });
  }

  healthCheck(status: 'healthy' | 'unhealthy', details: any) {
    const level = status === 'healthy' ? 'info' : 'error';
    this.logger.log(level, 'Health check performed', {
      category: 'system',
      event: 'health_check',
      status,
      details
    });
  }
}