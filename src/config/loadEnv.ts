import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { validateEnv } from './env.schema';

// Load environment variables from .env files
export const loadEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFiles = [
    `.env.${nodeEnv}.local`,
    `.env.${nodeEnv}`,
    '.env.local',
    '.env',
  ];
  
  // Load env files in order of precedence
  let loaded = false;
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      const result = dotenv.config({ path });
      if (result.error) {
        console.error(`Error loading ${file}:`, result.error);
      } else {
        console.log(`✅ Loaded environment from ${file}`);
        loaded = true;
      }
    }
  }
  
  if (!loaded && nodeEnv !== 'production') {
    console.warn('⚠️  No .env file found. Using default values.');
  }
  
  // Validate environment after loading
  const validation = validateEnv();
  if (!validation.success) {
    console.error('❌ Environment validation failed:');
    console.error(validation.error);
    
    // In development, continue with warnings
    if (nodeEnv === 'development') {
      console.warn('⚠️  Continuing in development mode with invalid environment');
    } else {
      // In production, exit on validation failure
      process.exit(1);
    }
  }
  
  return validation;
};

// Helper to safely get environment variables with fallback
export const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

// Helper to get boolean environment variables
export const getBoolEnv = (key: string, fallback = false): boolean => {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

// Helper to get numeric environment variables
export const getNumEnv = (key: string, fallback?: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Environment variable ${key} is not defined`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return num;
};

// Helper to get array environment variables (comma-separated)
export const getArrayEnv = (key: string, fallback: string[] = []): string[] => {
  const value = process.env[key];
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

// Environment-specific helpers
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';

// Initialize environment on module load
if (require.main === module) {
  loadEnv();
}
