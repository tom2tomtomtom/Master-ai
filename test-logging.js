/**
 * Test script for the structured logging system
 */

const { testLoggingSystem } = require('./src/lib/logging-config.ts');

async function runTest() {
  try {
    console.log('Testing structured logging system...');
    
    // Test system
    const result = await testLoggingSystem();
    
    console.log('Test result:', result);
    
    if (result.success) {
      console.log('✅ Structured logging system is working correctly!');
    } else {
      console.log('❌ Logging system test failed:', result.errors);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();