const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  globalSetup: '<rootDir>/jest.globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    // Require a .test/.spec suffix here too. The previous glob collected every
    // file under tests/, so shared fixtures like tests/utils/test-helpers.ts
    // were run as suites and failed with "must contain at least one test".
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  // Packages that ship ESM and therefore must be transformed. svix 2.x is the
  // one that actually needs it today (dist/index.mjs) - without it, importing
  // the Clerk webhook route throws "Cannot use import statement outside a
  // module".
  //
  // The `(?!\.pnpm/)` guard is load-bearing. pnpm resolves realpaths like
  //   node_modules/.pnpm/svix@2.0.0/node_modules/svix/dist/index.mjs
  // and the previous pattern matched at the FIRST `node_modules/` (followed by
  // `.pnpm/`), so every package was ignored and the allowlist never applied to
  // anything. Skipping that segment makes the match land on the inner
  // `node_modules/<pkg>/`, where the allowlist works - under both the pnpm and
  // the flat npm/yarn layouts.
  transformIgnorePatterns: [
    'node_modules/(?!\\.pnpm/)(?!(svix|openai|@clerk/|@neondatabase/))',
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
