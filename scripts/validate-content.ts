#!/usr/bin/env tsx

import { contentParser } from '../src/lib/content-parser';

async function validateContent() {
  console.log('🔍 Master AI Content Validator');
  console.log('===============================');

  try {
    console.time('Validation completed in');
    
    // Parse all lessons
    console.log('📚 Parsing all lesson files...');
    const lessons = await contentParser.parseAllLessons();
    
    console.log(`✅ Successfully parsed ${lessons.length} lessons`);
    
    // Validation checks
    const issues: Array<{
      lessonNumber: number;
      type: 'error' | 'warning' | 'info';
      message: string;
    }> = [];

    console.log('\n🔍 Running validation checks...');

    // Check for missing titles
    lessons.forEach(lesson => {
      if (!lesson.title || lesson.title === 'Untitled Lesson') {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'error',
          message: 'Missing or invalid title'
        });
      }
    });

    // Check for duplicate lesson numbers
    const lessonNumbers = lessons.map(l => l.lessonNumber);
    const duplicates = lessonNumbers.filter((num, index) => lessonNumbers.indexOf(num) !== index);
    duplicates.forEach(num => {
      issues.push({
        lessonNumber: num,
        type: 'error',
        message: 'Duplicate lesson number'
      });
    });

    // Check for missing descriptions
    lessons.forEach(lesson => {
      if (!lesson.description || lesson.description.includes('No description available')) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'warning',
          message: 'Missing or auto-generated description'
        });
      }
    });

    // Check for missing tools
    lessons.forEach(lesson => {
      if (lesson.tools.length === 0) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'info',
          message: 'No AI tools detected'
        });
      }
    });

    // Check content length
    lessons.forEach(lesson => {
      if (lesson.content.length < 500) {
        issues.push({
          lessonNumber: lesson.lessonNumber,
          type: 'warning',
          message: `Content appears short (${lesson.content.length} characters)`
        });
      }
    });

    // Display results
    console.log('\n📊 Validation Results:');
    console.log('======================');
    
    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');
    const info = issues.filter(i => i.type === 'info');

    console.log(`✅ Total lessons: ${lessons.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info: ${info.length}`);

    // Display issues
    if (issues.length > 0) {
      console.log('\n🔍 Issues Found:');
      issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} Lesson ${issue.lessonNumber}: ${issue.message}`);
      });
    }

    // Display categories
    console.log('\n📂 Learning Path Categories:');
    const categories = contentParser.getLearningPathCategories(lessons);
    categories.forEach((categoryLessons, categoryName) => {
      console.log(`  ${categoryName}: ${categoryLessons.length} lessons`);
    });

    // Display difficulty distribution
    console.log('\n📈 Difficulty Distribution:');
    const difficultyCount: Record<string, number> = {};
    lessons.forEach(lesson => {
      difficultyCount[lesson.difficultyLevel] = (difficultyCount[lesson.difficultyLevel] || 0) + 1;
    });
    Object.entries(difficultyCount).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count} lessons`);
    });

    // Display top tools
    console.log('\n🛠️  Top AI Tools:');
    const toolCount: Record<string, number> = {};
    lessons.forEach(lesson => {
      lesson.tools.forEach(tool => {
        toolCount[tool] = (toolCount[tool] || 0) + 1;
      });
    });
    
    Object.entries(toolCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([tool, count]) => {
        console.log(`  ${tool}: ${count} lessons`);
      });

    console.timeEnd('Validation completed in');
    
    if (errors.length === 0) {
      console.log('\n🎉 Content validation passed! Ready for import.');
    } else {
      console.log('\n⚠️  Please fix errors before importing content.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateContent().catch(console.error);
}