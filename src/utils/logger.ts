import winston from 'winston';
import { env } from '../config/env.schema';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' ? consoleFormat : logFormat,
      level: env.LOG_LEVEL,
    })
  );
}

// File transport for errors
transports.push(
  new winston.transports.File({
    filename: path.join(path.dirname(env.LOG_FILE), 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// File transport for all logs
transports.push(
  new winston.transports.File({
    filename: env.LOG_FILE,
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Child logger factory
export const createLogger = (service: string) => {
  return logger.child({ service });
};

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
};

// Utility functions for structured logging
export const logError = (message: string, error: Error, meta?: any) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...meta,
  });
};

export const logAudit = (action: string, userId: string, meta?: any) => {
  logger.info('Audit log', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

export const logPerformance = (operation: string, duration: number, meta?: any) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

// Export types
export type Logger = winston.Logger;
