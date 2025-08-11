#!/usr/bin/env tsx

import * as fs from 'fs';

/**
 * Script to trigger content import via API endpoint on production
 * Sends the lessons JSON data to the production API for import
 */

const PRODUCTION_URL = 'https://www.master-ai-learn.com';
const IMPORT_KEY = process.env.CONTENT_IMPORT_KEY || 'master-ai-import-2025';

async function triggerProductionImport() {
  console.log('🚀 Triggering production content import via API...');
  console.log('Target URL:', PRODUCTION_URL);
  
  try {
    // Load the lessons JSON data
    console.log('\n📂 Loading lessons data...');
    
    const jsonFilename = `lessons-data-compressed-${new Date().toISOString().split('T')[0]}.json`;
    
    if (!fs.existsSync(jsonFilename)) {
      console.error(`❌ JSON file not found: ${jsonFilename}`);
      console.log('Please run: npx tsx scripts/create-lesson-data-json.ts first');
      return;
    }
    
    const lessonsData = JSON.parse(fs.readFileSync(jsonFilename, 'utf8'));
    console.log(`📚 Loaded ${lessonsData.lessons.length} lessons from ${jsonFilename}`);
    
    // First, check current stats
    console.log('\n📊 Checking current database state...');
    const statsResponse = await fetch(`${PRODUCTION_URL}/api/admin/import-content`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`Current state: ${stats.stats?.totalLessons || 0} lessons, ${stats.stats?.totalLearningPaths || 0} paths`);
    } else {
      console.log('Could not get current stats:', statsResponse.status);
    }
    
    // Trigger the import
    console.log('\n🔄 Starting import process...');
    console.log(`📦 Sending ${lessonsData.lessons.length} lessons to production...`);
    
    const importResponse = await fetch(`${PRODUCTION_URL}/api/admin/import-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Import-Key': IMPORT_KEY
      },
      body: JSON.stringify(lessonsData)
    });
    
    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      console.error('❌ Import failed:', importResponse.status, errorText);
      return;
    }
    
    const result = await importResponse.json();
    
    if (result.success) {
      console.log('✅ Import completed successfully!');
      
      console.log('\n📈 Import Results:');
      console.log(`✅ Successful: ${result.importResults.successful}`);
      console.log(`❌ Failed: ${result.importResults.failed}`);
      console.log(`📊 Total: ${result.importResults.total}`);
      
      console.log('\n📊 Final Statistics:');
      console.log(`📚 Total Lessons: ${result.stats.totalLessons}`);
      console.log(`🛤️ Total Learning Paths: ${result.stats.totalLearningPaths}`);
      
      console.log('\n📈 Lessons by Difficulty:');
      Object.entries(result.stats.lessonsByDifficulty).forEach(([difficulty, count]) => {
        console.log(`  ${difficulty}: ${count}`);
      });
      
      console.log('\n🔧 Top AI Tools:');
      const topTools = Object.entries(result.stats.lessonsByTool)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10);
      
      topTools.forEach(([tool, count]) => {
        console.log(`  ${tool}: ${count} lessons`);
      });
      
      console.log('\n🎉 Production database is now ready!');
      console.log('🌐 Users should now be able to see all lessons in the UI');
    } else {
      console.error('❌ Import failed:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to trigger import:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.message.includes('ENOTFOUND') || error.message.includes('fetch')) {
        console.log('\n💡 This might be a network connectivity issue.');
        console.log('   Try running this script from a different network or use a VPN.');
      }
    }
  }
}

if (require.main === module) {
  triggerProductionImport().catch(console.error);
}