#!/usr/bin/env tsx

/**
 * Production Validation Script
 * 
 * This script validates that the production deployment is working correctly
 * by testing critical endpoints, database connectivity, and third-party integrations.
 * 
 * Usage:
 * - npm run validate-production
 * - tsx scripts/validate-production.ts
 * - tsx scripts/validate-production.ts --url https://your-domain.com
 */

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
}

class ProductionValidator {
  private baseUrl: string;
  private results: ValidationResult[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async validateAll(): Promise<void> {
    console.log('🔍 Master AI SaaS - Production Validation');
    console.log('==========================================');
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);

    // Run all validation tests
    await this.validateBasicConnectivity();
    await this.validateHealthEndpoint();
    await this.validateAuthentication();
    await this.validateAPIEndpoints();
    await this.validateStaticAssets();
    await this.validateSecurity();
    await this.validatePerformance();

    // Display results
    this.displayResults();
  }

  private async validateBasicConnectivity(): Promise<void> {
    await this.runTest('Basic Connectivity', async () => {
      const response = await fetch(this.baseUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return 'Application is accessible';
    });
  }

  private async validateHealthEndpoint(): Promise<void> {
    await this.runTest('Health Check', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }
      
      const health = await response.json();
      
      if (health.status !== 'healthy') {
        throw new Error(`Health status: ${health.status}`);
      }
      
      return `Health check passed (${health.environment})`;
    });

    await this.runTest('Detailed Health Check', async () => {
      const response = await fetch(`${this.baseUrl}/api/health?detailed=true`, {
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        // This might fail if there are issues, so we'll make it a warning
        throw new Error(`Detailed health check returned HTTP ${response.status}`);
      }
      
      const health = await response.json();
      const issues = [];
      
      if (health.checks?.database?.status !== 'healthy') {
        issues.push('Database');
      }
      
      if (health.checks?.external?.status !== 'healthy') {
        issues.push('External services');
      }
      
      if (issues.length > 0) {
        throw new Error(`Issues detected: ${issues.join(', ')}`);
      }
      
      return 'All systems healthy';
    });
  }

  private async validateAuthentication(): Promise<void> {
    await this.runTest('Authentication Pages', async () => {
      const signInResponse = await fetch(`${this.baseUrl}/auth/signin`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!signInResponse.ok) {
        throw new Error(`Sign-in page not accessible: HTTP ${signInResponse.status}`);
      }
      
      const signUpResponse = await fetch(`${this.baseUrl}/auth/signup`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!signUpResponse.ok) {
        throw new Error(`Sign-up page not accessible: HTTP ${signUpResponse.status}`);
      }
      
      return 'Authentication pages accessible';
    });

    await this.runTest('NextAuth Configuration', async () => {
      const response = await fetch(`${this.baseUrl}/api/auth/session`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Session endpoint not accessible: HTTP ${response.status}`);
      }
      
      // Should return empty session for unauthenticated request
      return 'NextAuth session endpoint working';
    });
  }

  private async validateAPIEndpoints(): Promise<void> {
    // Test protected API endpoints (should return 401/403)
    await this.runTest('Protected API Routes', async () => {
      const endpoints = [
        '/api/dashboard/stats',
        '/api/lessons',
        '/api/profile',
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          signal: AbortSignal.timeout(5000)
        });
        
        // Should return 401 (unauthorized) or 403 (forbidden) for protected routes
        if (response.status !== 401 && response.status !== 403) {
          throw new Error(`${endpoint} returned unexpected status: ${response.status}`);
        }
      }
      
      return 'Protected routes properly secured';
    });

    // Test public API endpoints
    await this.runTest('Public API Routes', async () => {
      const endpoints = [
        '/api/health',
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) {
          throw new Error(`${endpoint} failed: HTTP ${response.status}`);
        }
      }
      
      return 'Public routes accessible';
    });
  }

  private async validateStaticAssets(): Promise<void> {
    await this.runTest('Static Assets', async () => {
      const assets = [
        '/favicon.ico',
        '/robots.txt',
      ];
      
      let foundAssets = 0;
      
      for (const asset of assets) {
        try {
          const response = await fetch(`${this.baseUrl}${asset}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          });
          
          if (response.ok) {
            foundAssets++;
          }
        } catch (error) {
          // Asset might not exist, which is okay
        }
      }
      
      return `${foundAssets}/${assets.length} static assets found`;
    });
  }

  private async validateSecurity(): Promise<void> {
    await this.runTest('Security Headers', async () => {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy',
      ];
      
      const missingHeaders = requiredHeaders.filter(
        header => !response.headers.has(header)
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
      }
      
      return 'Security headers present';
    });

    await this.runTest('HTTPS Redirect', async () => {
      if (!this.baseUrl.startsWith('https://')) {
        return 'Skipped (not testing HTTPS URL)';
      }
      
      const httpUrl = this.baseUrl.replace('https://', 'http://');
      
      try {
        const response = await fetch(httpUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.status !== 301 && response.status !== 302) {
          throw new Error(`HTTP did not redirect to HTTPS (status: ${response.status})`);
        }
        
        const location = response.headers.get('location');
        if (!location?.startsWith('https://')) {
          throw new Error('Redirect location is not HTTPS');
        }
        
        return 'HTTP properly redirects to HTTPS';
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          return 'HTTP requests blocked (good security)';
        }
        throw error;
      }
    });
  }

  private async validatePerformance(): Promise<void> {
    await this.runTest('Response Time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(this.baseUrl, {
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (duration > 5000) {
        throw new Error(`Response time too slow: ${duration}ms`);
      }
      
      return `Response time: ${duration}ms`;
    });
  }

  private async runTest(name: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'pass',
        message,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      this.results.push({
        name,
        status: 'fail',
        message,
        duration,
      });
    }
  }

  private displayResults(): void {
    console.log('\n📊 Validation Results');
    console.log('====================\n');
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    
    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      
      console.log(`${icon} ${result.name}${duration}`);
      console.log(`   ${result.message}\n`);
      
      if (result.status === 'pass') passed++;
      else if (result.status === 'fail') failed++;
      else warnings++;
    }
    
    console.log('📈 Summary');
    console.log('----------');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${this.results.length}\n`);
    
    if (failed > 0) {
      console.log('💥 Some tests failed. Please review the issues above.');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('⚠️  Some tests have warnings. Review recommended but not critical.');
    } else {
      console.log('🎉 All tests passed! Production deployment looks healthy.');
    }
  }
}

async function main() {
  // Get URL from command line or environment
  const urlArg = process.argv.find(arg => arg.startsWith('--url='));
  const baseUrl = urlArg 
    ? urlArg.split('=')[1] 
    : process.env.NEXTAUTH_URL 
    || process.env.NEXT_PUBLIC_APP_URL 
    || 'http://localhost:3000';
  
  if (!baseUrl) {
    console.error('❌ No URL provided. Use --url=https://your-domain.com or set NEXTAUTH_URL environment variable.');
    process.exit(1);
  }
  
  const validator = new ProductionValidator(baseUrl);
  await validator.validateAll();
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('\n💥 Validation failed:', error.message);
    process.exit(1);
  });
}