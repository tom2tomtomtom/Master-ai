#!/usr/bin/env tsx

import { contentImporter } from '../src/lib/content-importer';

export async function importContent() {
  console.log('🎓 Master AI Content Importer');
  console.log('================================');
  
  const args = process.argv.slice(2);
  const shouldClearData = args.includes('--clear');
  
  if (shouldClearData) {
    console.log('⚠️  WARNING: This will clear all existing lessons and learning paths!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    console.time('Import completed in');
    
    await contentImporter.importAllContent();
    
    // Show import statistics
    console.log('\n📊 Import Statistics:');
    console.log('=====================');
    
    const stats = await contentImporter.getImportStats();
    console.log(`Total Lessons: ${stats.totalLessons}`);
    console.log(`Total Learning Paths: ${stats.totalLearningPaths}`);
    
    console.log('\nLessons by Difficulty:');
    Object.entries(stats.lessonsByDifficulty).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}`);
    });
    
    console.log('\nTop AI Tools:');
    const topTools = Object.entries(stats.lessonsByTool)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    topTools.forEach(([tool, count]) => {
      console.log(`  ${tool}: ${count} lessons`);
    });
    
    console.timeEnd('Import completed in');
    console.log('\n🎉 Content import successful! Your Master AI platform is ready.');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await contentImporter.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Import cancelled by user');
  await contentImporter.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Import terminated');
  await contentImporter.disconnect();
  process.exit(0);
});

if (require.main === module) {
  importContent().catch(console.error);
}