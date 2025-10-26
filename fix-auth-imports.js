#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files that import useAuth from auth-provider
const findAuthImports = () => {
  try {
    const result = execSync(`grep -r "useAuth.*auth-provider" src/ --include="*.tsx" --include="*.ts" -l`, { encoding: 'utf-8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('No files found with auth-provider imports');
    return [];
  }
};

// Replace auth-provider import with safe-auth-provider
const replaceAuthImport = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the import
    const updatedContent = content.replace(
      /from ['"]@\/components\/providers\/auth-provider['"]/g,
      "from '@/components/providers/safe-auth-provider'"
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated auth import in ${filePath}`);
      return true;
    } else {
      console.log(`✓ ${filePath} already using correct import or no changes needed`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const files = findAuthImports();
let updatedCount = 0;

console.log(`Found ${files.length} files with auth-provider imports\n`);

files.forEach(file => {
  if (replaceAuthImport(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated ${updatedCount} files to use safe-auth-provider`);