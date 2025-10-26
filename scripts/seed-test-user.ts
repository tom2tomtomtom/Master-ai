import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestUser() {
  const email = 'playwright-test@masterai.test';
  const password = 'TestPassword123!@#';
  
  console.log('🌱 Seeding test user for Playwright...');
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('   Email:', email);
      console.log('   Password:', password);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create test user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Playwright Test User',
        role: 'USER',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
      },
    });
    
    console.log('✅ Test user created successfully!');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Subscription: FREE tier');
    
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
