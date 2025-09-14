import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      publicMetadata: { role: 'admin' },
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  currentUser: jest.fn().mockResolvedValue({
    id: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    publicMetadata: { role: 'admin' },
  }),
  auth: jest.fn().mockResolvedValue({
    userId: 'test-user-id',
  }),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock Request for API route tests
global.Request = class Request {
  constructor(input, init = {}) {
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false,
      configurable: false,
    });
    this.method = init.method || 'GET';
    this.headers = new Map();
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }
};

// Mock Response for API route tests
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map();
    this.statusText = init.statusText || 'OK';
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }
};

// Mock NextRequest for API route tests
global.NextRequest = class NextRequest {
  constructor(input, init = {}) {
    Object.defineProperty(this, 'url', {
      value: typeof input === 'string' ? input : input.url,
      writable: false,
      configurable: false,
    });
    this.method = init.method || 'GET';
    this.headers = new Map();
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }
};

// Mock NextResponse for API route tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init = {}) => {
      const response = new global.Response(JSON.stringify(data), {
        status: init.status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    },
    redirect: (url, status = 302) => {
      return new global.Response(null, { status, headers: { Location: url } });
    },
    next: () => {
      return new global.Response(null, { status: 200 });
    },
    error: (message, status = 500) => {
      return new global.Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  }
}));

// Mock TextDecoder for Neon database
global.TextDecoder = class TextDecoder {
  decode(input) {
    return input;
  }
};

// Mock TextEncoder for Neon database
global.TextEncoder = class TextEncoder {
  encode(input) {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }
};

// Mock crypto for Clerk
global.crypto = {
  subtle: {},
  getRandomValues: (arr) => arr,
};

// Mock window.matchMedia (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock analysis module with default return value
jest.mock('@/lib/analysis', () => ({
  analyzeImages: jest.fn().mockResolvedValue({
    items: [
      {
        shortName: 'Test Item',
        description: 'Test description',
        estimatedDimensionsInches: { length: 10, width: 10, height: 10 },
        notes: 'Test notes',
        tags: ['test'],
        roomName: 'Test Room'
      }
    ],
    confidenceNote: 'Test confidence note'
  }),
  analyzeImageWithOpenAI: jest.fn(),
  generateInventoryReport: jest.fn()
}))
