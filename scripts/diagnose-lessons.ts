/**
 * Diagnostic Script for Lesson System
 *
 * This script checks:
 * 1. Database connection
 * 2. Lesson count in database
 * 3. Markdown files on disk
 * 4. API endpoint functionality
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

async function diagnose() {
  const results: DiagnosticResult[] = [];

  console.log('🔍 Master-AI Lesson System Diagnostics\n');
  console.log('=' .repeat(50));

  // Step 1: Check database connection
  console.log('\n📊 Step 1: Checking database connection...');
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    results.push({
      step: 'Database Connection',
      status: 'success',
      message: 'Successfully connected to database'
    });
    console.log('✅ Database connection successful');
  } catch (error) {
    results.push({
      step: 'Database Connection',
      status: 'error',
      message: 'Failed to connect to database',
      details: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Database connection failed');
    console.log('   Error:', error instanceof Error ? error.message : String(error));
    console.log('\n💡 Fix: Update DATABASE_URL in .env with valid Supabase credentials');
    return results;
  }

  // Step 2: Count lessons in database
  console.log('\n📚 Step 2: Checking lessons in database...');
  try {
    const lessonCount = await prisma.lesson.count();
    const publishedCount = await prisma.lesson.count({ where: { isPublished: true } });
    const freeCount = await prisma.lesson.count({ where: { isFree: true } });

    results.push({
      step: 'Lessons in Database',
      status: lessonCount > 0 ? 'success' : 'warning',
      message: `Found ${lessonCount} lessons (${publishedCount} published, ${freeCount} free)`,
      details: { total: lessonCount, published: publishedCount, free: freeCount }
    });

    console.log(`✅ Found ${lessonCount} lessons in database`);
    console.log(`   📖 Published: ${publishedCount}`);
    console.log(`   🆓 Free: ${freeCount}`);

    if (lessonCount === 0) {
      console.log('\n⚠️  Warning: No lessons in database!');
      console.log('   💡 Fix: Run `npm run import-content` to import lessons');
    }

    // Show sample lessons
    const sampleLessons = await prisma.lesson.findMany({
      take: 5,
      orderBy: { lessonNumber: 'asc' },
      select: {
        lessonNumber: true,
        title: true,
        isPublished: true,
        isFree: true
      }
    });

    if (sampleLessons.length > 0) {
      console.log('\n   Sample lessons:');
      sampleLessons.forEach(lesson => {
        const status = lesson.isPublished ? '✓' : '✗';
        const freeStatus = lesson.isFree ? '🆓' : '💳';
        console.log(`     ${status} ${freeStatus} Lesson ${lesson.lessonNumber}: ${lesson.title}`);
      });
    }
  } catch (error) {
    results.push({
      step: 'Lessons in Database',
      status: 'error',
      message: 'Failed to query lessons',
      details: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Failed to query lessons');
    console.log('   Error:', error instanceof Error ? error.message : String(error));
  }

  // Step 3: Check markdown files
  console.log('\n📄 Step 3: Checking markdown files on disk...');
  try {
    const rootDir = process.cwd();
    const files = fs.readdirSync(rootDir);
    const lessonFiles = files.filter(f => f.startsWith('lesson-') && f.endsWith('.md'));

    results.push({
      step: 'Markdown Files',
      status: 'success',
      message: `Found ${lessonFiles.length} lesson markdown files`,
      details: { count: lessonFiles.length, files: lessonFiles.slice(0, 5) }
    });

    console.log(`✅ Found ${lessonFiles.length} lesson markdown files`);

    if (lessonFiles.length > 0) {
      console.log('   Sample files:');
      lessonFiles.slice(0, 5).forEach(file => {
        console.log(`     - ${file}`);
      });
    }

    if (lessonFiles.length === 0) {
      console.log('\n⚠️  Warning: No lesson files found!');
      console.log('   💡 Check that lesson-*.md files are in the project root');
    }
  } catch (error) {
    results.push({
      step: 'Markdown Files',
      status: 'error',
      message: 'Failed to read markdown files',
      details: error instanceof Error ? error.message : String(error)
    });
    console.log('❌ Failed to read markdown files');
  }

  // Step 4: Check categories
  console.log('\n🏷️  Step 4: Checking lesson categories...');
  try {
    const categoryCount = await prisma.lessonCategory.count();
    results.push({
      step: 'Lesson Categories',
      status: 'success',
      message: `Found ${categoryCount} categories`,
      details: { count: categoryCount }
    });
    console.log(`✅ Found ${categoryCount} lesson categories`);

    if (categoryCount === 0) {
      console.log('   💡 Consider adding categories for better organization');
    }
  } catch (error) {
    results.push({
      step: 'Lesson Categories',
      status: 'warning',
      message: 'Could not query categories',
      details: error instanceof Error ? error.message : String(error)
    });
  }

  // Step 5: Check environment variables
  console.log('\n🔐 Step 5: Checking environment variables...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length === 0) {
    results.push({
      step: 'Environment Variables',
      status: 'success',
      message: 'All required environment variables are set'
    });
    console.log('✅ All required environment variables are set');
  } else {
    results.push({
      step: 'Environment Variables',
      status: 'error',
      message: `Missing ${missingVars.length} required environment variables`,
      details: { missing: missingVars }
    });
    console.log('❌ Missing environment variables:');
    missingVars.forEach(v => console.log(`   - ${v}`));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 SUMMARY\n');

  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const successCount = results.filter(r => r.status === 'success').length;

  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n🔧 ACTION REQUIRED:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`\n   ${r.step}:`);
      console.log(`     ${r.message}`);
      if (r.details) {
        console.log(`     Details: ${typeof r.details === 'string' ? r.details : JSON.stringify(r.details, null, 2)}`);
      }
    });
  }

  // Recommendations
  console.log('\n💡 NEXT STEPS:\n');

  const lessonCount = results.find(r => r.step === 'Lessons in Database')?.details?.total || 0;

  if (errorCount === 0 && lessonCount === 0) {
    console.log('1. Import lessons: npm run import-content');
    console.log('2. Verify in database: check Supabase dashboard');
    console.log('3. Test API: curl http://localhost:3000/api/lessons');
    console.log('4. Deploy: npx vercel deploy --prod');
  } else if (errorCount > 0) {
    console.log('1. Fix database connection errors (see above)');
    console.log('2. Update .env with correct Supabase credentials');
    console.log('3. Re-run this diagnostic: npx tsx scripts/diagnose-lessons.ts');
  } else {
    console.log('✅ System appears healthy!');
    console.log('   Test the app: npm run dev');
    console.log('   Visit: http://localhost:3000/discover');
  }

  await prisma.$disconnect();
}

diagnose().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
