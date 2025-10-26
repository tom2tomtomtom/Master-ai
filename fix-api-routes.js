#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all API route files that don't already have dynamic export
const findApiRoutes = () => {
  try {
    const result = execSync(`find src/app/api -name "route.ts" -type f`, { encoding: 'utf-8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding API routes:', error);
    return [];
  }
};

// Add dynamic export to API route file
const addDynamicExport = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`✓ ${filePath} already has dynamic export`);
      return false;
    }
    
    // Find first import line and add dynamic export after imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find last import line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('// ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '') {
        continue; // Skip empty lines
      } else {
        break;
      }
    }
    
    // Insert dynamic export
    lines.splice(insertIndex, 0, '', '// Mark this route as dynamic to prevent static generation', 'export const dynamic = \'force-dynamic\';');
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✅ Added dynamic export to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
};

// Main execution
const apiRoutes = findApiRoutes();
let updatedCount = 0;

console.log(`Found ${apiRoutes.length} API route files\n`);

apiRoutes.forEach(route => {
  if (addDynamicExport(route)) {
    updatedCount++;
  }
});

console.log(`\n✨ Updated ${updatedCount} API route files`);