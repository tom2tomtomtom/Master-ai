#!/usr/bin/env tsx

/**
 * Diagnostic script to identify production API issues
 * Helps troubleshoot why lessons aren't showing in the UI
 */

const PRODUCTION_URL = 'https://www.master-ai-learn.com';

interface TestResult {
  endpoint: string;
  status: number | string;
  success: boolean;
  details: string;
}

async function testEndpoint(path: string, description: string): Promise<TestResult> {
  try {
    console.log(`🧪 Testing: ${description}`);
    const response = await fetch(`${PRODUCTION_URL}${path}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const success = response.status === 200;
    let details = `HTTP ${response.status}`;
    
    if (success) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        try {
          const data = await response.json();
          if (Array.isArray(data)) {
            details = `${data.length} items returned`;
          } else if (data.lessons) {
            details = `${data.lessons.length} lessons found`;
          } else {
            details = 'JSON response received';
          }
        } catch {
          details = 'JSON parse error';
        }
      } else {
        details = `HTML response (${contentType})`;
      }
    }
    
    console.log(`   ${success ? '✅' : '❌'} ${details}\n`);
    
    return {
      endpoint: path,
      status: response.status,
      success,
      details
    };
  } catch (error) {
    console.log(`   ❌ Network error: ${error}\n`);
    return {
      endpoint: path,
      status: 'ERROR',
      success: false,
      details: `Network error: ${error}`
    };
  }
}

async function runDiagnostics() {
  console.log('🔍 Production API Diagnostics');
  console.log('=============================\n');
  
  const tests: Array<{path: string, description: string}> = [
    { path: '/', description: 'Homepage (static)' },
    { path: '/api/health', description: 'Health check endpoint' },
    { path: '/api/health/database', description: 'Database health check' },
    { path: '/api/lessons', description: 'Lessons API (main endpoint)' },
    { path: '/api/dashboard/stats', description: 'Dashboard stats API' },
    { path: '/dashboard', description: 'Dashboard page (requires auth?)' },
    { path: '/auth/signin', description: 'Auth page (should work)' },
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    results.push(result);
  }
  
  console.log('📊 Summary:');
  console.log('----------');
  
  const working = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Working endpoints: ${working}/${total}`);
  console.log(`❌ Failed endpoints: ${total - working}/${total}\n`);
  
  if (working === 0) {
    console.log('🚨 CRITICAL: No endpoints are working');
    console.log('   This suggests a fundamental deployment or configuration issue\n');
  } else if (results.find(r => r.endpoint === '/api/lessons' && !r.success)) {
    console.log('🚨 LESSON API ISSUE: Main lessons endpoint is failing');
    console.log('   This is why lessons don\'t show in the UI\n');
  }
  
  // Check specific patterns
  const apiResults = results.filter(r => r.endpoint.startsWith('/api/'));
  const allApiFailing = apiResults.every(r => !r.success);
  const anyApiWorking = apiResults.some(r => r.success);
  
  if (allApiFailing && anyApiWorking === false) {
    console.log('🔍 DIAGNOSIS: All API endpoints are failing');
    console.log('   Possible causes:');
    console.log('   • Database connection still pointing to wrong database');
    console.log('   • Environment variables not properly updated in deployment');
    console.log('   • Prisma client needs regeneration');
    console.log('   • Deployment cache issues');
    console.log('   • Database authentication/permissions issues\n');
  }
  
  console.log('🔧 RECOMMENDED ACTIONS:');
  console.log('---------------------');
  
  if (results.find(r => r.endpoint === '/' && r.success)) {
    console.log('✅ Static site is working (good!)');
  } else {
    console.log('❌ Even static site is failing - major deployment issue');
  }
  
  if (allApiFailing) {
    console.log('1. Check Vercel deployment logs for errors');
    console.log('2. Verify DATABASE_URL environment variable in Vercel');
    console.log('3. Check if Prisma client is properly generated in build');
    console.log('4. Verify Supabase database is accessible from Vercel');
    console.log('5. Try a fresh deployment with no build cache');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('-------------');
  console.log('1. Check Vercel deployment dashboard for build errors');
  console.log('2. Review function logs in Vercel for specific error messages');
  console.log('3. Verify all environment variables are properly set');
  console.log('4. Consider running a clean rebuild');
  
  const failedEndpoints = results.filter(r => !r.success);
  if (failedEndpoints.length > 0) {
    console.log('\n❌ Failed Endpoints Detail:');
    failedEndpoints.forEach(result => {
      console.log(`   ${result.endpoint}: ${result.details}`);
    });
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);