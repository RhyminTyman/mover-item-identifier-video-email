/**
 * Test helper utilities
 * Common functions for testing across the application
 */

import { PrismaClient } from '@prisma/client';

/**
 * Create test user
 */
export async function createTestUser(prisma: PrismaClient, overrides?: any) {
  return await prisma.user.create({
    data: {
      clerkId: `test_${Date.now()}_${Math.random()}`,
      email: `test_${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      isActive: true,
      onboarded: true,
      ...overrides
    }
  });
}

/**
 * Create test company
 */
export async function createTestCompany(prisma: PrismaClient, overrides?: any) {
  return await prisma.company.create({
    data: {
      name: 'Test Moving Company',
      address: '123 Test St',
      city: 'Test City',
      state: 'NY',
      zipCode: '10001',
      phone: '(555) 123-4567',
      email: 'test@testcompany.com',
      ...overrides
    }
  });
}

/**
 * Create test inventory
 */
export async function createTestInventory(prisma: PrismaClient, userId: string, overrides?: any) {
  return await prisma.inventory.create({
    data: {
      title: 'Test Inventory',
      note: 'Test note',
      status: 'submitted',
      userId,
      ...overrides
    }
  });
}

/**
 * Create test item
 */
export async function createTestItem(prisma: PrismaClient, inventoryId: string, overrides?: any) {
  return await prisma.item.create({
    data: {
      inventoryId,
      shortName: 'Test Item',
      description: 'Test description',
      count: 1,
      tags: [],
      ...overrides
    }
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in correct order to respect foreign key constraints
  await prisma.item.deleteMany({
    where: {
      inventory: {
        title: { contains: 'Test' }
      }
    }
  });

  await prisma.photo.deleteMany({
    where: {
      inventory: {
        title: { contains: 'Test' }
      }
    }
  });

  await prisma.inventory.deleteMany({
    where: {
      title: { contains: 'Test' }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: { contains: '@test.com' }
    }
  });

  await prisma.company.deleteMany({
    where: {
      name: { contains: 'Test' }
    }
  });
}

/**
 * Mock fetch response
 */
export function mockFetchResponse(data: any, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData()
  } as Response);
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate random test data
 */
export const testData = {
  email: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
  phone: () => `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  name: () => {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    return {
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
  },
  address: () => ({
    street: `${Math.floor(Math.random() * 9999)} Test St`,
    city: 'Test City',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  }),
  company: () => ({
    name: `Test Company ${Date.now()}`,
    address: `${Math.floor(Math.random() * 9999)} Business Ave`,
    city: 'Test City',
    state: 'NY',
    zipCode: '10001',
    phone: testData.phone(),
    email: testData.email()
  })
};

/**
 * Assert response is successful
 */
export function assertSuccess(response: Response, message?: string): void {
  if (!response.ok) {
    throw new Error(message || `Expected successful response, got ${response.status}`);
  }
}

/**
 * Assert response has error
 */
export function assertError(response: Response, expectedStatus?: number, message?: string): void {
  if (response.ok) {
    throw new Error(message || 'Expected error response, got success');
  }

  if (expectedStatus && response.status !== expectedStatus) {
    throw new Error(
      message || `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

