import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Performance monitoring interface
interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  cpu: number[];
}

// Metrics storage (in production, use a proper metrics service)
const metricsBuffer: RequestMetrics[] = [];
const METRICS_BUFFER_SIZE = 1000;

// CPU usage tracking
let lastCpuUsage = process.cpuUsage();

// Request timing middleware
export const requestMetrics = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const requestId = uuidv4();
  
  // Attach request ID
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Capture initial CPU usage
  const startCpuUsage = process.cpuUsage();
  
  // Log function
  const logMetrics = () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Calculate CPU usage
    const cpuUsage = process.cpuUsage(startCpuUsage);
    const cpuPercent = [
      (cpuUsage.user / 1000 / duration) * 100,
      (cpuUsage.system / 1000 / duration) * 100,
    ];
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    
    // Create metrics object
    const metrics: RequestMetrics = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
      cpu: cpuPercent,
    };
    
    // Add to buffer
    metricsBuffer.push(metrics);
    if (metricsBuffer.length > METRICS_BUFFER_SIZE) {
      metricsBuffer.shift();
    }
    
    // Log based on performance
    if (duration > 1000) {
      logger.warn('Slow request detected', metrics);
    } else if (res.statusCode >= 400) {
      logger.warn('Request failed', metrics);
    } else {
      logger.info('Request completed', metrics);
    }
    
    // Remove listeners
    res.removeListener('finish', logMetrics);
    res.removeListener('close', logMetrics);
  };
  
  // Listen for response events
  res.on('finish', logMetrics);
  res.on('close', logMetrics);
  
  next();
};

// Metrics aggregation endpoint handler
export const getMetrics = (req: Request, res: Response) => {
  const stats = calculateStats();
  res.json({
    stats,
    recentRequests: metricsBuffer.slice(-100),
    system: getSystemMetrics(),
  });
};

// Calculate statistics from metrics buffer
const calculateStats = () => {
  if (metricsBuffer.length === 0) {
    return {
      totalRequests: 0,
      averageDuration: 0,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }
  
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  const recentMetrics = metricsBuffer.filter(m => 
    now - m.duration < 60000
  );
  
  const totalRequests = metricsBuffer.length;
  const totalDuration = metricsBuffer.reduce((sum, m) => sum + m.duration, 0);
  const errorCount = metricsBuffer.filter(m => m.statusCode >= 400).length;
  
  return {
    totalRequests,
    averageDuration: totalDuration / totalRequests,
    errorRate: (errorCount / totalRequests) * 100,
    requestsPerMinute: recentMetrics.length,
    statusCodes: groupBy(metricsBuffer, 'statusCode'),
    slowestEndpoints: getSlowustEndpoints(),
  };
};

// Get system metrics
const getSystemMetrics = () => {
  return {
    uptime: process.uptime(),
    memory: {
      ...process.memoryUsage(),
      total: os.totalmem(),
      free: os.freemem(),
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: os.loadavg(),
      cores: os.cpus().length,
    },
  };
};

// Helper to group metrics
const groupBy = (arr: any[], key: string) => {
  return arr.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

// Get slowest endpoints
const getSlowustEndpoints = () => {
  const endpointDurations: Record<string, number[]> = {};
  
  metricsBuffer.forEach(m => {
    const key = `${m.method} ${m.path}`;
    if (!endpointDurations[key]) {
      endpointDurations[key] = [];
    }
    endpointDurations[key].push(m.duration);
  });
  
  return Object.entries(endpointDurations)
    .map(([endpoint, durations]) => ({
      endpoint,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      count: durations.length,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);
};

// Export metrics for external monitoring
export const exportMetrics = () => metricsBuffer;
