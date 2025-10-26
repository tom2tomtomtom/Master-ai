#!/usr/bin/env tsx

/**
 * Script to help diagnose production database configuration issues
 * This provides the correct environment variables that should be set in Vercel
 */

console.log('🔍 Production Configuration Checker');
console.log('=====================================\n');

console.log('📋 Required Vercel Environment Variables:');
console.log('----------------------------------------');

// Read local config for reference
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('✅ Based on your local .env, Vercel production should have:\n');
  
  // Extract Supabase config from local .env
  const lines = envContent.split('\n');
  const supabaseVars = lines.filter((line: string) => 
    line.includes('DATABASE_URL=') || 
    line.includes('NEXT_PUBLIC_SUPABASE_') ||
    line.includes('SUPABASE_SERVICE_ROLE_KEY=') ||
    line.includes('NEXTAUTH_')
  );
  
  supabaseVars.forEach((line: string) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        console.log(`${key.trim()}=${value.trim()}`);
      }
    }
  });

  console.log('\n🎯 Action Required:');
  console.log('-------------------');
  console.log('1. Go to Vercel Dashboard → master-ai-saas → Settings → Environment Variables');
  console.log('2. Update these variables to match the Supabase values above');
  console.log('3. Redeploy the application');
  console.log('4. The API should then connect to Supabase with your imported lessons\n');

  console.log('🚨 Common Issues:');
  console.log('-----------------');
  console.log('• Vercel still has old PostgreSQL DATABASE_URL');
  console.log('• Missing SUPABASE environment variables');
  console.log('• Environment variables not updated after import');
  console.log('• Need to trigger a new deployment after env var changes\n');

  console.log('✅ Expected Result After Fix:');
  console.log('------------------------------');
  console.log('• https://www.master-ai-learn.com/api/lessons returns lesson data');
  console.log('• Dashboard shows all 86 lessons');
  console.log('• Users can access lesson content');
  console.log('• No more 500 errors on API endpoints\n');

  // Also check current Prisma configuration
  console.log('📊 Current Prisma Schema Points To:');
  console.log('-----------------------------------');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const datasourceMatch = schemaContent.match(/url\s*=\s*env\("([^"]+)"\)/);
    if (datasourceMatch) {
      console.log(`Using environment variable: ${datasourceMatch[1]}`);
      const envVarValue = process.env[datasourceMatch[1]];
      if (envVarValue) {
        // Mask password in output
        const maskedUrl = envVarValue.replace(/:([^@]+)@/, ':***@');
        console.log(`Current value: ${maskedUrl}`);
        
        if (envVarValue.includes('supabase.com')) {
          console.log('✅ Local config correctly points to Supabase');
        } else {
          console.log('❌ Local config points to non-Supabase database');
        }
      } else {
        console.log('❌ Environment variable not found locally');
      }
    }
  }

} catch (error) {
  console.error('❌ Error reading configuration:', error);
}

console.log('\n🔧 Quick Test:');
console.log('-------------');
console.log('After updating Vercel environment variables, test:');
console.log('curl https://www.master-ai-learn.com/api/lessons');
console.log('Should return JSON with lesson data instead of 500 error');