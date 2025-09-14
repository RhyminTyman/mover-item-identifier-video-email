import { MockRequest } from '@playwright/test'

/**
 * Test utilities and helpers for both unit and E2E tests
 */

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  publicMetadata: { role: 'customer' },
}

export const mockAdminUser = {
  id: 'test-admin-id',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  publicMetadata: { role: 'admin' },
}

export const mockSalesRepUser = {
  id: 'test-sales-id',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  publicMetadata: { role: 'sales' },
}

export const mockInventory = {
  id: 'inv-123',
  title: 'Smith Family Move',
  status: 'submitted',
  createdAt: '2024-01-15T10:00:00Z',
  user: mockUser,
  items: [
    {
      id: '1',
      shortName: 'Sofa',
      description: 'Large 3-seat fabric sofa',
      roomName: 'Living Room',
      lengthIn: 84,
      widthIn: 36,
      heightIn: 34,
      tags: ['furniture', 'living-room'],
    },
    {
      id: '2',
      shortName: 'Dining Table',
      description: 'Wooden dining table with 6 chairs',
      roomName: 'Dining Room',
      lengthIn: 72,
      widthIn: 42,
      heightIn: 30,
      tags: ['furniture', 'dining-room'],
    },
  ],
}

export const mockCrmIntegration = {
  id: 'crm-1',
  provider: 'smartmoving',
  name: 'SmartMoving Integration',
  description: 'Test integration',
  isActive: true,
  syncLeads: true,
  syncSales: true,
  syncSchedule: true,
  syncCustomers: true,
  lastSyncAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockCrmLead = {
  id: 'lead-1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  phone: '+1-555-0123',
  status: 'new',
  priority: 'high',
  estimatedValue: 2500,
  moveDate: '2024-02-15T00:00:00Z',
  createdAt: '2024-01-15T00:00:00Z',
}

export const mockCrmSale = {
  id: 'sale-1',
  opportunityName: 'John Smith Residential Move',
  stage: 'proposal',
  probability: 75,
  estimatedValue: 2500,
  actualValue: null,
  expectedCloseDate: '2024-02-01T00:00:00Z',
  createdAt: '2024-01-15T00:00:00Z',
}

export const mockCrmSchedule = {
  id: 'schedule-1',
  title: 'Site Visit - John Smith',
  startTime: '2024-01-20T10:00:00Z',
  endTime: '2024-01-20T12:00:00Z',
  type: 'site-visit',
  status: 'scheduled',
  location: '123 Main St',
  createdAt: '2024-01-15T00:00:00Z',
}

// API response mocks
export const mockApiResponses = {
  inventories: {
    list: [mockInventory],
    single: mockInventory,
    create: { ...mockInventory, id: 'inv-new' },
    update: mockInventory,
    delete: { success: true },
  },
  crm: {
    integrations: [mockCrmIntegration],
    leads: [mockCrmLead],
    sales: [mockCrmSale],
    schedules: [mockCrmSchedule],
    sync: {
      success: {
        message: 'CRM data synced successfully',
        results: {
          leads: { synced: 5, created: 3, updated: 2 },
          sales: { synced: 3, created: 1, updated: 2 },
          schedules: { synced: 8, created: 4, updated: 4 },
        },
      },
    },
  },
  analysis: {
    success: {
      items: [
        {
          shortName: 'Sofa',
          description: 'Large 3-seat fabric sofa',
          roomName: 'Living Room',
          dimensions: { length: 84, width: 36, height: 34 },
          tags: ['furniture', 'living-room', 'large'],
        },
      ],
    },
  },
  pricing: {
    calculated: {
      baseCost: 200,
      additionalHandling: 50,
      disposal: 25,
      storage: 0,
      stairs: 30,
      packing: 40,
      unpacking: 25,
      distance: 15,
      subtotal: 385,
      tax: 30.8,
      totalCost: 415.8,
    },
  },
}

// Test helpers
export const testHelpers = {
  /**
   * Generate a random string for testing
   */
  randomString: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length)
  },

  /**
   * Generate a random email for testing
   */
  randomEmail: (): string => {
    return `test-${testHelpers.randomString()}@example.com`
  },

  /**
   * Generate a random phone number for testing
   */
  randomPhone: (): string => {
    return `+1-555-${Math.floor(Math.random() * 9000) + 1000}`
  },

  /**
   * Generate a random date for testing
   */
  randomDate: (daysFromNow: number = 30): string => {
    const date = new Date()
    date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow))
    return date.toISOString()
  },

  /**
   * Mock fetch with predefined responses
   */
  mockFetch: (responses: Record<string, any>) => {
    return jest.fn().mockImplementation((url: string) => {
      const key = Object.keys(responses).find(k => url.includes(k))
      if (key) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses[key]),
        })
      }
      return Promise.reject(new Error(`No mock response for ${url}`))
    })
  },

  /**
   * Wait for element to be visible (for E2E tests)
   */
  waitForElement: async (page: any, selector: string, timeout: number = 5000) => {
    await page.waitForSelector(selector, { timeout })
    return page.locator(selector)
  },

  /**
   * Mock authentication state
   */
  mockAuth: (user: any) => {
    return {
      useUser: () => ({
        user,
        isLoaded: true,
        isSignedIn: true,
      }),
      useAuth: () => ({
        isSignedIn: true,
        userId: user.id,
      }),
    }
  },

  /**
   * Generate test file data
   */
  createTestFile: (name: string, type: string = 'image/jpeg', size: number = 1024) => {
    return new File(['x'.repeat(size)], name, { type })
  },

  /**
   * Mock file upload
   */
  mockFileUpload: (files: File[]) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    
    // Mock the files property
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    })
    
    return input
  },
}

// Common test configurations
export const testConfig = {
  timeout: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },
  retries: {
    unit: 0,
    e2e: 2,
  },
  viewport: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
}

// Test data cleanup helpers
export const cleanupHelpers = {
  /**
   * Clear all mocks
   */
  clearMocks: () => {
    jest.clearAllMocks()
    if (global.fetch && 'mockClear' in global.fetch) {
      (global.fetch as jest.Mock).mockClear()
    }
  },

  /**
   * Reset all mocks
   */
  resetMocks: () => {
    jest.resetAllMocks()
    if (global.fetch && 'mockReset' in global.fetch) {
      (global.fetch as jest.Mock).mockReset()
    }
  },

  /**
   * Restore all mocks
   */
  restoreMocks: () => {
    jest.restoreAllMocks()
    if (global.fetch && 'mockRestore' in global.fetch) {
      (global.fetch as jest.Mock).mockRestore()
    }
  },
}

// Error simulation helpers
export const errorHelpers = {
  /**
   * Generate API error response
   */
  apiError: (message: string = 'Internal server error', status: number = 500) => {
    return {
      ok: false,
      status,
      json: () => Promise.resolve({ error: message }),
    }
  },

  /**
   * Generate network error
   */
  networkError: () => {
    return new Error('Network error')
  },

  /**
   * Generate timeout error
   */
  timeoutError: () => {
    return new Error('Request timeout')
  },
}

export default {
  mockUser,
  mockAdminUser,
  mockSalesRepUser,
  mockInventory,
  mockCrmIntegration,
  mockCrmLead,
  mockCrmSale,
  mockCrmSchedule,
  mockApiResponses,
  testHelpers,
  testConfig,
  cleanupHelpers,
  errorHelpers,
}
