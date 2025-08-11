#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();

async function setup() {
  console.log('🎓 Master AI Content Management Setup');
  console.log('====================================');

  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      console.error('❌ Please run this script from the project root directory');
      process.exit(1);
    }

    // Check for .env file
    console.log('📝 Checking environment configuration...');
    if (!fs.existsSync('.env')) {
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ Created .env file from example');
        console.log('⚠️  Please edit .env with your database configuration');
      } else {
        console.log('⚠️  No .env.example found, creating basic .env file');
        const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/master_ai_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
`;
        fs.writeFileSync('.env', envContent);
        console.log('✅ Created basic .env file');
      }
    } else {
      console.log('✅ .env file already exists');
    }

    // Check Node.js version
    console.log('🔍 Checking Node.js version...');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      console.error(`❌ Node.js v18+ required, found ${nodeVersion}`);
      process.exit(1);
    }
    console.log(`✅ Node.js ${nodeVersion} is compatible`);

    // Install dependencies if needed
    console.log('📦 Checking dependencies...');
    if (!fs.existsSync('node_modules')) {
      console.log('Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    } else {
      console.log('✅ Dependencies already installed');
    }

    // Check if Prisma is set up
    console.log('🗄️  Checking database setup...');
    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.log('⚠️  Prisma client generation failed - database may not be configured');
    }

    // Validate content files
    console.log('📚 Validating content files...');
    try {
      execSync('npm run validate-content', { stdio: 'pipe' });
      console.log('✅ Content validation passed');
    } catch (error) {
      console.log('⚠️  Content validation issues found - check with `npm run validate-content`');
    }

    // Create directories if needed
    const directories = [
      'logs',
      'backups',
      'temp'
    ];

    directories.forEach(dir => {
      const dirPath = path.join(PROJECT_ROOT, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created ${dir} directory`);
      }
    });

    // Show next steps
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Edit .env file with your database configuration');
    console.log('2. Set up your PostgreSQL database');
    console.log('3. Run: npx prisma migrate dev');
    console.log('4. Run: npm run validate-content');
    console.log('5. Run: npm run import-content');
    console.log('6. Run: npm run dev');
    console.log('7. Visit: http://localhost:3000/admin');

    console.log('\n🛠️  Available Commands:');
    console.log('======================');
    console.log('npm run validate-content  - Validate lesson files');
    console.log('npm run import-content    - Import all content');
    console.log('npm run dev              - Start development server');
    console.log('npm run build            - Build for production');

    console.log('\n📚 Documentation:');
    console.log('=================');
    console.log('- Content Management Guide: CONTENT_MANAGEMENT_GUIDE.md');
    console.log('- Database Schema: prisma/schema.prisma');
    console.log('- API Documentation: Available at /api endpoints');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

setup().catch(console.error);