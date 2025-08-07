#!/usr/bin/env tsx

/**
 * Staging Deployment Validation Script
 * 
 * This script validates a deployed staging environment to ensure
 * all critical functionality works correctly for user testing.
 * 
 * Usage:
 * npm run validate-staging https://your-staging-domain.vercel.app
 * tsx scripts/validate-staging.ts https://your-staging-domain.vercel.app
 */

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  url?: string;
}

interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  results: ValidationResult[];
}

async function main() {
  const stagingUrl = process.argv[2];
  
  if (!stagingUrl) {
    console.error('❌ Please provide the staging URL as an argument');
    console.error('Usage: tsx scripts/validate-staging.ts https://your-staging-domain.vercel.app');
    process.exit(1);
  }

  console.log('🔍 Master-AI SaaS Staging Validation');
  console.log('===================================');
  console.log(`Target: ${stagingUrl}`);
  console.log('');

  const summary: ValidationSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    results: []
  };

  try {
    // Basic connectivity tests
    await validateBasicConnectivity(stagingUrl, summary);
    
    // API health checks
    await validateAPIHealthChecks(stagingUrl, summary);
    
    // Core functionality tests
    await validateCoreFunctionality(stagingUrl, summary);
    
    // Content accessibility tests
    await validateContentAccess(stagingUrl, summary);
    
    // Generate validation report
    generateValidationReport(summary);
    
  } catch (error) {
    console.error('❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

async function validateBasicConnectivity(baseUrl: string, summary: ValidationSummary) {
  console.log('🌐 Basic Connectivity Tests');
  console.log('---------------------------');
  
  // Test homepage
  await testEndpoint(baseUrl, 'Homepage', summary);
  
  // Test health endpoint
  await testEndpoint(`${baseUrl}/api/health`, 'Health Check API', summary);
  
  console.log('');
}

async function validateAPIHealthChecks(baseUrl: string, summary: ValidationSummary) {
  console.log('🔧 API Health Checks');
  console.log('--------------------');
  
  const endpoints = [
    { path: '/api/health', name: 'System Health' },
    { path: '/api/lessons', name: 'Lessons API' },
    { path: '/api/learning-paths', name: 'Learning Paths API' },
    { path: '/api/dashboard/stats', name: 'Dashboard Stats' }
  ];
  
  for (const endpoint of endpoints) {
    await testEndpoint(`${baseUrl}${endpoint.path}`, endpoint.name, summary);
  }
  
  console.log('');
}

async function validateCoreFunctionality(baseUrl: string, summary: ValidationSummary) {
  console.log('⚙️ Core Functionality Tests');
  console.log('---------------------------');
  
  const pages = [
    { path: '/auth/signin', name: 'Sign In Page' },
    { path: '/auth/signup', name: 'Sign Up Page' },
    { path: '/auth/forgot-password', name: 'Password Reset Page' },
    { path: '/dashboard', name: 'Dashboard Page' }
  ];
  
  for (const page of pages) {
    await testEndpoint(`${baseUrl}${page.path}`, page.name, summary);
  }
  
  console.log('');
}

async function validateContentAccess(baseUrl: string, summary: ValidationSummary) {
  console.log('📚 Content Access Tests');
  console.log('-----------------------');
  
  // Test lesson access (we'll check for lesson 1-5 as sample)
  for (let i = 1; i <= 5; i++) {
    await testEndpoint(`${baseUrl}/dashboard/lesson/${i}`, `Lesson ${i}`, summary);
  }
  
  // Test learning paths
  await testEndpoint(`${baseUrl}/dashboard/paths`, 'Learning Paths Page', summary);
  
  console.log('');
}

async function testEndpoint(url: string, name: string, summary: ValidationSummary): Promise<void> {
  summary.total++;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Master-AI-Staging-Validator/1.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      summary.passed++;
      summary.results.push({
        name,
        status: 'pass',
        message: `✅ ${response.status} ${response.statusText}`,
        url
      });
      console.log(`   ✅ ${name}: ${response.status} ${response.statusText}`);
    } else if (response.status === 404) {
      summary.warnings++;
      summary.results.push({
        name,
        status: 'warn',
        message: `⚠️  ${response.status} Not Found (may require authentication)`,
        url
      });
      console.log(`   ⚠️  ${name}: ${response.status} Not Found (may require authentication)`);
    } else {
      summary.failed++;
      summary.results.push({
        name,
        status: 'fail',
        message: `❌ ${response.status} ${response.statusText}`,
        url
      });
      console.log(`   ❌ ${name}: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    summary.failed++;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    summary.results.push({
      name,
      status: 'fail',
      message: `❌ Connection failed: ${errorMessage}`,
      url
    });
    console.log(`   ❌ ${name}: Connection failed - ${errorMessage}`);
  }
}

function generateValidationReport(summary: ValidationSummary) {
  console.log('📊 Validation Summary');
  console.log('====================');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`❌ Failed: ${summary.failed}`);
  
  const successRate = Math.round((summary.passed / summary.total) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  console.log('');
  
  if (summary.failed > 0) {
    console.log('❌ Failed Tests:');
    summary.results
      .filter(r => r.status === 'fail')
      .forEach(result => {
        console.log(`   - ${result.name}: ${result.message}`);
        if (result.url) console.log(`     URL: ${result.url}`);
      });
    console.log('');
  }
  
  if (summary.warnings > 0) {
    console.log('⚠️  Warnings:');
    summary.results
      .filter(r => r.status === 'warn')
      .forEach(result => {
        console.log(`   - ${result.name}: ${result.message}`);
        if (result.url) console.log(`     URL: ${result.url}`);
      });
    console.log('');
  }
  
  // Deployment readiness assessment
  if (successRate >= 90) {
    console.log('🎉 Deployment Status: READY FOR USER TESTING');
    console.log('The staging environment is ready for user testing.');
  } else if (successRate >= 75) {
    console.log('⚠️  Deployment Status: PARTIALLY READY');
    console.log('The staging environment has some issues but may be suitable for limited testing.');
  } else {
    console.log('❌ Deployment Status: NOT READY');
    console.log('The staging environment has critical issues that must be resolved.');
    process.exit(1);
  }
  
  console.log('');
  console.log('🔗 Next Steps:');
  console.log('1. Test user registration and login manually');
  console.log('2. Verify Stripe payment integration with test cards');
  console.log('3. Check lesson content rendering and navigation');
  console.log('4. Test subscription gating for premium content');
  console.log('5. Monitor logs for any runtime errors');
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

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Validation failed:', error.message);
    process.exit(1);
  });
}