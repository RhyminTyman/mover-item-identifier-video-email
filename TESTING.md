# Testing Guide

This project includes comprehensive testing setup with both unit tests (Jest + React Testing Library) and end-to-end tests (Playwright).

## 🧪 Test Structure

```
├── tests/
│   ├── unit/                 # Unit tests
│   │   ├── CrmManagement.test.tsx
│   │   ├── WorkflowStatus.test.tsx
│   │   ├── crm-connectors.test.ts
│   │   └── email.test.ts
│   ├── integration/          # Integration tests
│   └── utils/
│       └── test-helpers.ts   # Test utilities
├── e2e/                      # End-to-end tests
│   ├── crm-integration.spec.ts
│   ├── workflow.spec.ts
│   └── inventory-creation.spec.ts
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Jest setup
├── playwright.config.ts     # Playwright configuration
└── .github/workflows/test.yml # CI/CD test workflow
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# View E2E test report
npm run test:e2e:report
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## 🛠️ Setup

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers:
```bash
npm run playwright:install
```

3. Install Playwright system dependencies (Linux only):
```bash
npm run playwright:install-deps
```

### Environment Variables

Create a `.env.test` file for testing:

```env
DATABASE_URL="postgresql://test:test@localhost:5432/test_db"
CLERK_SECRET_KEY="test-secret-key"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="test-public-key"
OPENAI_API_KEY="test-openai-key"
RESEND_API_KEY="test-resend-key"
AWS_ACCESS_KEY_ID="test-access-key"
AWS_SECRET_ACCESS_KEY="test-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="test-bucket"
UPSTASH_REDIS_REST_URL="test-redis-url"
UPSTASH_REDIS_REST_TOKEN="test-redis-token"
```

## 📝 Writing Tests

### Unit Tests

Unit tests use Jest and React Testing Library. Example:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { CrmManagement } from '@/components/admin/CrmManagement'

describe('CrmManagement', () => {
  it('renders CRM management interface', () => {
    render(<CrmManagement />)
    expect(screen.getByText('CRM Integration Management')).toBeInTheDocument()
  })
})
```

### E2E Tests

E2E tests use Playwright. Example:

```typescript
import { test, expect } from '@playwright/test'

test('admin can add CRM integration', async ({ page }) => {
  await page.goto('/admin/crm')
  await page.getByText('Add Integration').click()
  // ... test steps
})
```

## 🎯 Test Coverage

The test suite covers:

### Unit Tests
- ✅ CRM Management component
- ✅ Workflow Status component  
- ✅ CRM Connectors (SmartMoving, MoveGuru)
- ✅ Email service functions
- ✅ API route handlers
- ✅ Utility functions

### E2E Tests
- ✅ CRM integration workflow
- ✅ Inventory creation and management
- ✅ Workflow status updates
- ✅ User authentication flows
- ✅ Admin dashboard functionality
- ✅ Error handling scenarios

## 🔧 Test Utilities

Use the test helpers from `tests/utils/test-helpers.ts`:

```typescript
import { testHelpers, mockUser, mockInventory } from '@/tests/utils/test-helpers'

// Generate test data
const randomEmail = testHelpers.randomEmail()
const testFile = testHelpers.createTestFile('test.jpg')

// Mock API responses
const mockFetch = testHelpers.mockFetch({
  'api/inventories': [mockInventory]
})
```

## 🚦 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

The CI pipeline:
1. Runs linting and type checking
2. Executes unit tests with coverage
3. Builds the application
4. Runs E2E tests
5. Uploads test reports and coverage

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory:

```bash
npm run test:coverage
open coverage/index.html
```

Target coverage goals:
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

## 🐛 Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test -- CrmManagement.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Tests

```bash
# Debug specific test
npm run test:e2e:debug -- crm-integration.spec.ts

# Run with browser visible
npm run test:e2e:headed

# Generate trace for debugging
npm run test:e2e -- --trace on
```

## 📱 Browser Support

E2E tests run on:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari

## 🔍 Best Practices

### Unit Tests
1. Test behavior, not implementation
2. Use meaningful test descriptions
3. Keep tests focused and isolated
4. Mock external dependencies
5. Use data-testid for stable selectors

### E2E Tests
1. Test user workflows, not individual features
2. Use page object model for complex interactions
3. Wait for elements explicitly
4. Mock external APIs
5. Clean up test data after tests

### General
1. Write tests before fixing bugs (TDD)
2. Keep tests fast and reliable
3. Use descriptive test names
4. Group related tests with `describe`
5. Clean up after tests

## 🚨 Troubleshooting

### Common Issues

**Tests timing out:**
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**E2E tests failing:**
```bash
# Check browser installation
npm run playwright:install

# Run with debug info
npm run test:e2e:debug
```

**Coverage not updating:**
```bash
# Clear cache and reinstall
rm -rf node_modules/.cache
pnpm install
npm run test:coverage
```

### Getting Help

1. Check the test logs for detailed error messages
2. Run tests in debug mode to step through issues
3. Verify all dependencies are installed correctly
4. Ensure environment variables are set properly

## 📈 Performance

- Unit tests should complete in < 30 seconds
- E2E tests should complete in < 5 minutes
- Use `test.slow()` for tests that take longer than expected
- Parallelize tests when possible

## 🔄 Maintenance

- Update test data when APIs change
- Review and update mocks regularly
- Keep test dependencies up to date
- Monitor test performance and flakiness
- Add tests for new features before deployment
