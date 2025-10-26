import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const prisma = new PrismaClient();

async function seedTestUser() {
  const email = 'playwright-test@masterai.test';
  const password = 'TestPassword123!@#';
  
  console.log('🌱 Seeding test user in Supabase Auth...');
  
  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Playwright Test User',
      },
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ User already exists in Supabase Auth');
        
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
          // Step 2: Sync to Prisma database
          const prismaUser = await prisma.user.upsert({
            where: { email },
            create: {
              id: existingUser.id,
              email,
              name: 'Playwright Test User',
              role: 'USER',
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
            },
            update: {},
          });
          
          console.log('✅ User synced to Prisma database');
        }
      } else {
        throw authError;
      }
    } else if (authData.user) {
      console.log('✅ User created in Supabase Auth!');
      console.log('   User ID:', authData.user.id);
      
      // Step 2: Create matching user in Prisma database
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          name: 'Playwright Test User',
          role: 'USER',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      });
      
      console.log('✅ User created in Prisma database!');
    }
    
    console.log('\n📋 Test User Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Can sign in at: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
