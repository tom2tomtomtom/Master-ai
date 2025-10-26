/**
 * Seed script for achievements and certifications
 * 
 * This script populates the database with:
 * - Achievement definitions with criteria
 * - Certification definitions for learning paths and skills
 * - Certificate templates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Achievement definitions
const achievements = [
  // Milestone Achievements
  {
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 1 },
    pointsAwarded: 10,
    displayOrder: 1,
  },
  {
    name: 'Getting Started',
    description: 'Complete 5 lessons',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 5 },
    pointsAwarded: 25,
    displayOrder: 2,
  },
  {
    name: 'Making Progress',
    description: 'Complete 10 lessons',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 10 },
    pointsAwarded: 50,
    displayOrder: 3,
  },
  {
    name: 'Quarter Way There',
    description: 'Complete 25 lessons',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 25 },
    pointsAwarded: 100,
    displayOrder: 4,
  },
  {
    name: 'Halfway Hero',
    description: 'Complete 50 lessons',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 50 },
    pointsAwarded: 200,
    displayOrder: 5,
  },
  {
    name: 'AI Master',
    description: 'Complete all 88 lessons',
    category: 'milestone',
    type: 'lessons_completed',
    icon: 'trophy',
    color: 'text-yellow-600',
    criteria: { type: 'lessons_completed', threshold: 88 },
    pointsAwarded: 500,
    displayOrder: 6,
  },

  // Streak Achievements
  {
    name: 'Daily Learner',
    description: 'Maintain a 3-day learning streak',
    category: 'streak',
    type: 'streak_days',
    icon: 'fire',
    color: 'text-orange-600',
    criteria: { type: 'streak_days', threshold: 3 },
    pointsAwarded: 15,
    displayOrder: 1,
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'streak',
    type: 'streak_days',
    icon: 'fire',
    color: 'text-orange-600',
    criteria: { type: 'streak_days', threshold: 7 },
    pointsAwarded: 50,
    displayOrder: 2,
  },
  {
    name: 'Consistency Champion',
    description: 'Maintain a 30-day learning streak',
    category: 'streak',
    type: 'streak_days',
    icon: 'fire',
    color: 'text-orange-600',
    criteria: { type: 'streak_days', threshold: 30 },
    pointsAwarded: 200,
    displayOrder: 3,
  },
  {
    name: 'Streak Legend',
    description: 'Maintain a 100-day learning streak',
    category: 'streak',
    type: 'streak_days',
    icon: 'fire',
    color: 'text-orange-600',
    criteria: { type: 'streak_days', threshold: 100 },
    pointsAwarded: 1000,
    displayOrder: 4,
  },

  // Engagement Achievements
  {
    name: 'Note Taker',
    description: 'Create 10 lesson notes',
    category: 'engagement',
    type: 'notes_taken',
    icon: 'pencil',
    color: 'text-purple-600',
    criteria: { type: 'notes_taken', threshold: 10 },
    pointsAwarded: 25,
    displayOrder: 1,
  },
  {
    name: 'Prolific Writer',
    description: 'Create 50 lesson notes',
    category: 'engagement',
    type: 'notes_taken',
    icon: 'pencil',
    color: 'text-purple-600',
    criteria: { type: 'notes_taken', threshold: 50 },
    pointsAwarded: 100,
    displayOrder: 2,
  },
  {
    name: 'Bookmark Collector',
    description: 'Bookmark 25 lessons',
    category: 'engagement',
    type: 'bookmarks_created',
    icon: 'bookmark',
    color: 'text-indigo-600',
    criteria: { type: 'bookmarks_created', threshold: 25 },
    pointsAwarded: 50,
    displayOrder: 3,
  },
  {
    name: 'Highly Engaged',
    description: 'Achieve high engagement score',
    category: 'engagement',
    type: 'engagement_score',
    icon: 'star',
    color: 'text-blue-600',
    criteria: { 
      type: 'engagement_score', 
      threshold: 100,
      metadata: {
        weights: { lessons: 1, notes: 2, bookmarks: 1, streak: 3 }
      }
    },
    pointsAwarded: 150,
    displayOrder: 4,
  },

  // Speed Achievements
  {
    name: 'Quick Learner',
    description: 'Complete 5 lessons in one week',
    category: 'speed',
    type: 'speed_completion',
    icon: 'sparkles',
    color: 'text-green-600',
    criteria: { 
      type: 'speed_completion', 
      threshold: 1,
      metadata: { daysAllowed: 7, lessonsRequired: 5 }
    },
    pointsAwarded: 75,
    displayOrder: 1,
  },
  {
    name: 'Speed Demon',
    description: 'Complete 10 lessons in one week',
    category: 'speed',
    type: 'speed_completion',
    icon: 'sparkles',
    color: 'text-green-600',
    criteria: { 
      type: 'speed_completion', 
      threshold: 1,
      metadata: { daysAllowed: 7, lessonsRequired: 10 }
    },
    pointsAwarded: 150,
    displayOrder: 2,
  },

  // Time-based Achievements
  {
    name: 'Dedicated Student',
    description: 'Spend 10 hours learning',
    category: 'milestone',
    type: 'time_spent',
    icon: 'clock',
    color: 'text-blue-600',
    criteria: { type: 'time_spent', threshold: 600 }, // 10 hours in minutes
    pointsAwarded: 100,
    displayOrder: 7,
  },
  {
    name: 'Study Marathon',
    description: 'Spend 50 hours learning',
    category: 'milestone',
    type: 'time_spent',
    icon: 'clock',
    color: 'text-blue-600',
    criteria: { type: 'time_spent', threshold: 3000 }, // 50 hours in minutes
    pointsAwarded: 500,
    displayOrder: 8,
  },

  // Special Achievements
  {
    name: 'Early Bird',
    description: 'Beta tester - joined during beta',
    category: 'special',
    type: 'special',
    icon: 'star',
    color: 'text-pink-600',
    criteria: { type: 'special', threshold: 1 },
    pointsAwarded: 100,
    displayOrder: 1,
  },
];

// Certification definitions
const certifications = [
  // Learning Path Certificates
  {
    name: 'Text & Research AI Master',
    description: 'Master of conversational AI tools including ChatGPT, Claude, and Gemini',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-01', 'lesson-02', 'lesson-03', 'lesson-04', 'lesson-05', 'lesson-06', 'lesson-07', 'lesson-08', 'lesson-09', 'lesson-10', 'lesson-11', 'lesson-12', 'lesson-13', 'lesson-14', 'lesson-15', 'lesson-16', 'lesson-17', 'lesson-18'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 18, operator: 'gte' },
      { type: 'time', value: 720, operator: 'gte' } // 12 hours
    ],
    displayOrder: 1,
  },
  {
    name: 'Visual AI Creator',
    description: 'Expert in AI image generation with DALL-E, Midjourney, and Stable Diffusion',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-37', 'lesson-38', 'lesson-39', 'lesson-40', 'lesson-41', 'lesson-42', 'lesson-43', 'lesson-44', 'lesson-45', 'lesson-46', 'lesson-47', 'lesson-48'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 12, operator: 'gte' },
      { type: 'time', value: 480, operator: 'gte' } // 8 hours
    ],
    displayOrder: 2,
  },
  {
    name: 'AI Research Specialist',
    description: 'Advanced researcher using Perplexity and other research AI tools',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-28', 'lesson-29', 'lesson-30', 'lesson-31', 'lesson-32', 'lesson-33', 'lesson-34', 'lesson-35', 'lesson-36'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 9, operator: 'gte' },
      { type: 'time', value: 360, operator: 'gte' } // 6 hours
    ],
    displayOrder: 3,
  },
  {
    name: 'Productivity AI Expert',
    description: 'Master of workplace AI tools including Copilot, Notion AI, and NotebookLM',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-55', 'lesson-56', 'lesson-57', 'lesson-59', 'lesson-60', 'lesson-61'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 6, operator: 'gte' },
      { type: 'time', value: 240, operator: 'gte' } // 4 hours
    ],
    displayOrder: 4,
  },
  {
    name: 'AI Automation Professional',
    description: 'Expert in AI automation with Zapier, N8N, and Power Automate',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-81', 'lesson-82', 'lesson-83', 'lesson-69', 'lesson-70', 'lesson-74'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 6, operator: 'gte' },
      { type: 'time', value: 300, operator: 'gte' } // 5 hours
    ],
    displayOrder: 5,
  },
  {
    name: 'AI Media Creator',
    description: 'Specialist in AI-powered video and audio content creation',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-53', 'lesson-54', 'lesson-64', 'lesson-65', 'lesson-66', 'lesson-67'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 6, operator: 'gte' },
      { type: 'time', value: 240, operator: 'gte' } // 4 hours
    ],
    displayOrder: 6,
  },
  {
    name: 'AI Developer',
    description: 'Proficient in AI-powered development tools and coding assistants',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-84', 'lesson-85', 'lesson-86', 'lesson-87', 'lesson-88'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 5, operator: 'gte' },
      { type: 'time', value: 300, operator: 'gte' } // 5 hours
    ],
    displayOrder: 7,
  },
  {
    name: 'AI Strategy Leader',
    description: 'Expert in AI business strategy, ethics, and organizational implementation',
    type: 'path',
    category: 'learning_path',
    lessonsRequired: ['lesson-68', 'lesson-75', 'lesson-76', 'lesson-77', 'lesson-78', 'lesson-79'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 6, operator: 'gte' },
      { type: 'time', value: 360, operator: 'gte' } // 6 hours
    ],
    displayOrder: 8,
  },

  // Tool Mastery Certificates
  {
    name: 'ChatGPT Expert',
    description: 'Advanced mastery of ChatGPT across all use cases',
    type: 'tool_mastery',
    category: 'skill',
    lessonsRequired: ['lesson-01', 'lesson-02', 'lesson-03', 'lesson-04', 'lesson-05', 'lesson-06', 'lesson-07', 'lesson-08', 'lesson-09', 'lesson-49'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 10, operator: 'gte' },
      { type: 'time', value: 400, operator: 'gte' } // 6.5 hours
    ],
    displayOrder: 9,
  },
  {
    name: 'Claude Professional',
    description: 'Advanced proficiency with Claude AI for complex reasoning and analysis',
    type: 'tool_mastery',
    category: 'skill',
    lessonsRequired: ['lesson-10', 'lesson-11', 'lesson-12', 'lesson-13', 'lesson-14', 'lesson-15', 'lesson-16', 'lesson-17', 'lesson-18', 'lesson-50', 'lesson-51', 'lesson-87'],
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 12, operator: 'gte' },
      { type: 'time', value: 480, operator: 'gte' } // 8 hours
    ],
    displayOrder: 10,
  },

  // Overall Completion Certificate
  {
    name: 'Master-AI Certified Professional',
    description: 'Complete mastery of all AI tools and concepts taught in Master-AI',
    type: 'professional',
    category: 'professional',
    lessonsRequired: [], // Will be populated with all lesson IDs
    pathsRequired: [],
    requirements: [
      { type: 'lessons', value: 88, operator: 'gte' },
      { type: 'time', value: 2640, operator: 'gte' }, // 44 hours (30min avg per lesson)
      { type: 'streak', value: 7, operator: 'gte' }
    ],
    validityPeriod: 24, // 2 years
    displayOrder: 11,
  },
];

export async function seedDatabase() {
  console.log('🌱 Seeding achievements and certifications...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.userAchievement.deleteMany();
    await prisma.userCertification.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.certification.deleteMany();

    // Seed achievements
    console.log('🏆 Creating achievements...');
    for (const achievement of achievements) {
      await prisma.achievement.create({
        data: {
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          type: achievement.type,
          icon: achievement.icon,
          color: achievement.color,
          criteria: achievement.criteria,
          pointsAwarded: achievement.pointsAwarded,
          displayOrder: achievement.displayOrder,
          isActive: true,
        },
      });
      console.log(`✅ Created achievement: ${achievement.name}`);
    }

    // Seed certifications
    console.log('🎓 Creating certifications...');
    for (const certification of certifications) {
      await prisma.certification.create({
        data: {
          name: certification.name,
          description: certification.description,
          type: certification.type,
          category: certification.category,
          lessonsRequired: certification.lessonsRequired,
          pathsRequired: certification.pathsRequired,
          requirements: certification.requirements,
          validityPeriod: certification.validityPeriod || null,
          displayOrder: certification.displayOrder,
          isActive: true,
        },
      });
      console.log(`✅ Created certification: ${certification.name}`);
    }

    console.log('🎉 Seeding completed successfully!');
    console.log(`📊 Created ${achievements.length} achievements and ${certifications.length} certifications`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase();