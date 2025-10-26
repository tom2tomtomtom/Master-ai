import { faker } from '@faker-js/faker';

export const TEST_USERS = {
  // Main test user - pre-seeded in database
  primary: {
    email: 'playwright-test@masterai.test',
    password: 'TestPassword123!@#',
    name: 'Playwright Test User',
  },
  
  // Additional test user for multi-user scenarios
  secondary: {
    email: `test+secondary+${Date.now()}@masterai.test`,
    password: 'TestPassword123!@#',
    name: 'Secondary Test User',
  },
};

// Helper to generate unique test data
export function generateTestUser() {
  return {
    email: faker.internet.email(),
    password: 'TestPassword123!@#',
    name: faker.person.fullName(),
  };
}