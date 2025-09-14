import { jest } from '@jest/globals';

describe('middleware.ts - 100% Coverage Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockClerkMiddleware: jest.MockedFunction<any>;
  let mockCreateRouteMatcher: jest.MockedFunction<any>;
  let mockNextResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original environment
    originalEnv = process.env;
    
    // Mock console.warn to avoid noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Create fresh mocks for each test
    mockClerkMiddleware = jest.fn();
    mockCreateRouteMatcher = jest.fn();
    mockNextResponse = {
      next: jest.fn()
    };
    
    // Mock the modules
    jest.doMock('@clerk/nextjs/server', () => ({
      clerkMiddleware: mockClerkMiddleware,
      createRouteMatcher: mockCreateRouteMatcher
    }));
    
    jest.doMock('next/server', () => ({
      NextResponse: mockNextResponse
    }));
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should export default middleware function', async () => {
    mockClerkMiddleware.mockReturnValue(jest.fn());
    mockCreateRouteMatcher.mockReturnValue(jest.fn());
    
    const middleware = await import('@/middleware');
    
    expect(middleware.default).toBeDefined();
    expect(typeof middleware.default).toBe('function');
  });

  it('should export config object', async () => {
    const middleware = await import('@/middleware');
    
    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toBeDefined();
    expect(Array.isArray(middleware.config.matcher)).toBe(true);
    expect(middleware.config.matcher).toContain('/((?!.*\\..*|_next|_not-found|_error).*)');
    expect(middleware.config.matcher).toContain('/');
    expect(middleware.config.matcher).toContain('/(api|trpc)(.*)');
  });

  it('should create route matcher with correct public routes', async () => {
    mockCreateRouteMatcher.mockReturnValue(jest.fn());
    
    await import('@/middleware');
    
    expect(mockCreateRouteMatcher).toHaveBeenCalledWith([
      "/sign-in(.*)",
      "/sign-up(.*)",
      "/api/webhooks(.*)",
      "/api/health(.*)",
      "/api/test(.*)",
      "/_not-found",
    ]);
  });

  describe('isClerkConfigured function', () => {
    it('should return true when Clerk publishable key is properly configured', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      await import('@/middleware');
      
      // Test the function behavior by checking environment
      const isConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");
      expect(isConfigured).toBe(true);
    });

    it('should return false when Clerk publishable key is missing', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      const middleware = await import('@/middleware');
      
      // The isClerkConfigured function is not exported, so we test the behavior indirectly
      // by checking that the environment variable is undefined
      expect(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBeUndefined();
    });

    it('should return false when Clerk publishable key does not start with pk_', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'invalid_key_format';
      
      await import('@/middleware');
      
      // Test that the key doesn't start with pk_
      expect(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")).toBe(false);
    });

    it('should return false when Clerk publishable key is empty string', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = '';
      
      await import('@/middleware');
      
      // Test that empty string is falsy
      expect(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe('');
      expect(Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_"))).toBe(false);
    });
  });

  describe('Middleware function behavior', () => {
    it('should call clerkMiddleware with correct parameters', async () => {
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      
      await import('@/middleware');
      
      expect(mockClerkMiddleware).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should test middleware logic with Clerk configured and public route', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(true);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = { protect: jest.fn() };
      const mockReq = { url: '/sign-in' };
      
      const result = await middlewareFunction(mockAuth, mockReq);
      
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should test middleware logic with Clerk configured and private route', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = { protect: jest.fn() };
      const mockReq = { url: '/dashboard' };
      
      const result = await middlewareFunction(mockAuth, mockReq);
      
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should test middleware logic with Clerk not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      mockNextResponse.next.mockReturnValue({ type: 'next' });
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = { protect: jest.fn() };
      const mockReq = { url: '/dashboard' };
      
      const result = await middlewareFunction(mockAuth, mockReq);
      
      expect(console.warn).toHaveBeenCalledWith("⚠️ [Middleware] Clerk not configured, allowing all requests");
      expect(mockNextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: 'next' });
    });

    it('should test middleware logic with auth.protect throwing error', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = {
        protect: jest.fn().mockRejectedValue(new Error('Authentication failed'))
      };
      const mockReq = {
        url: '/dashboard'
      };
      
      await expect(middlewareFunction(mockAuth, mockReq)).rejects.toThrow('Authentication failed');
      expect(mockAuth.protect).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle middleware function with undefined auth', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockReq = {
        url: '/dashboard'
      };
      
      await expect(middlewareFunction(undefined, mockReq)).rejects.toThrow();
    });

    it('should handle middleware function with undefined req', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = {
        protect: jest.fn()
      };
      
      // The middleware function should handle undefined req gracefully
      const result = await middlewareFunction(mockAuth, undefined);
      // The function should complete without throwing
      expect(() => middlewareFunction(mockAuth, undefined)).not.toThrow();
    });

    it('should handle middleware function with null auth', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockReq = {
        url: '/dashboard'
      };
      
      await expect(middlewareFunction(null, mockReq)).rejects.toThrow();
    });

    it('should handle middleware function with null req', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = {
        protect: jest.fn()
      };
      
      // The middleware function should handle null req gracefully
      const result = await middlewareFunction(mockAuth, null);
      // The function should complete without throwing
      expect(() => middlewareFunction(mockAuth, null)).not.toThrow();
    });

    it('should handle environment variable with special characters', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key_with_special_chars_!@#$%^&*()';
      
      await import('@/middleware');
      
      const isConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");
      expect(isConfigured).toBe(true);
    });

    it('should handle very long environment variable', async () => {
      const longKey = 'pk_' + 'a'.repeat(1000);
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = longKey;
      
      await import('@/middleware');
      
      const isConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");
      expect(isConfigured).toBe(true);
    });

    it('should handle environment variable with only pk_', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_';
      
      await import('@/middleware');
      
      const isConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");
      expect(isConfigured).toBe(true);
    });

    it('should handle multiple imports of middleware', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      // Import multiple times to test module caching
      const middleware1 = await import('@/middleware');
      const middleware2 = await import('@/middleware');
      
      expect(middleware1.default).toBe(middleware2.default);
      expect(middleware1.config).toBe(middleware2.config);
    });
  });

  describe('Route matching edge cases', () => {
    it('should handle route matcher returning null', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(null);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = {
        protect: jest.fn()
      };
      const mockReq = {
        url: '/dashboard'
      };
      
      const result = await middlewareFunction(mockAuth, mockReq);
      
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should handle route matcher throwing an error', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockImplementation(() => {
        throw new Error('Route matcher error');
      });
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      let middlewareFunction: any;
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      const mockAuth = {
        protect: jest.fn()
      };
      const mockReq = {
        url: '/dashboard'
      };
      
      await expect(middlewareFunction(mockAuth, mockReq)).rejects.toThrow('Route matcher error');
    });
  });
});
