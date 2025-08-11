/**
 * Logger Configuration
 * 
 * Centralized configuration for the logging system
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Log levels with priority
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Colors for console output in development
export const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  trace: 'gray'
};

// Custom log format for JSON structure
export const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
export const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Create Winston logger instance with proper configuration
 */
export function createWinstonLogger(): winston.Logger {
  const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    levels: logLevels,
    format: jsonFormat,
    defaultMeta: {
      service: 'master-ai-saas',
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      nodeVersion: process.version
    },
    transports: []
  });

  // Add colors to Winston
  winston.addColors(logColors);

  // Configure transports based on environment
  if (isProduction) {
    // Production: File logging with rotation
    logger.add(
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info'
      })
    );

    logger.add(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '90d',
        level: 'error'
      })
    );

    // Also log to console in production for container logs
    logger.add(
      new winston.transports.Console({
        format: jsonFormat,
        level: 'info'
      })
    );
  } else if (isDevelopment) {
    // Development: Console logging with colors
    logger.add(
      new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
      })
    );
  } else if (isTest) {
    // Test: Minimal logging
    logger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
        level: 'error',
        silent: true
      })
    );
  }

  return logger;
}