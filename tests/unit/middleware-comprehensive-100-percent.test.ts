import { jest } from '@jest/globals';

describe('middleware.ts - Comprehensive 100% Coverage Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockClerkMiddleware: jest.MockedFunction<any>;
  let mockCreateRouteMatcher: jest.MockedFunction<any>;
  let mockNextResponse: any;
  let mockAuth: any;
  let mockReq: any;
  let middlewareFunction: any;

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
      next: jest.fn().mockReturnValue({ type: 'next' })
    };
    
    mockAuth = {
      protect: jest.fn()
    };
    
    mockReq = {
      url: '/test'
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
    middlewareFunction = null;
  });

  describe('isClerkConfigured function execution', () => {
    it('should execute isClerkConfigured when Clerk is properly configured', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      await middlewareFunction(mockAuth, mockReq);
      
      // Verify that isClerkConfigured was executed (Clerk is configured, so no warning)
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).toHaveBeenCalled();
    });

    it('should execute isClerkConfigured when Clerk is not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      const result = await middlewareFunction(mockAuth, mockReq);
      
      // Verify that isClerkConfigured was executed (Clerk not configured, so warning)
      expect(console.warn).toHaveBeenCalledWith("⚠️ [Middleware] Clerk not configured, allowing all requests");
      expect(mockNextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: 'next' });
    });
  });

  describe('Middleware function execution paths', () => {
    it('should execute middleware with Clerk configured and public route', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(true);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      const result = await middlewareFunction(mockAuth, mockReq);
      
      // Verify execution path
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should execute middleware with Clerk configured and private route', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      const result = await middlewareFunction(mockAuth, mockReq);
      
      // Verify execution path
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should execute middleware with Clerk not configured', async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      const result = await middlewareFunction(mockAuth, mockReq);
      
      // Verify execution path
      expect(console.warn).toHaveBeenCalledWith("⚠️ [Middleware] Clerk not configured, allowing all requests");
      expect(mockNextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ type: 'next' });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle auth.protect throwing an error', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      const mockAuthWithError = {
        protect: jest.fn().mockRejectedValue(new Error('Authentication failed'))
      };
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function and expect it to throw
      await expect(middlewareFunction(mockAuthWithError, mockReq)).rejects.toThrow('Authentication failed');
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuthWithError.protect).toHaveBeenCalled();
    });

    it('should handle route matcher returning null', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(null);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      const result = await middlewareFunction(mockAuth, mockReq);
      
      // Verify execution path (null is falsy, so should call protect)
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
      expect(mockAuth.protect).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle route matcher throwing an error', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockImplementation(() => {
        throw new Error('Route matcher error');
      });
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function and expect it to throw
      await expect(middlewareFunction(mockAuth, mockReq)).rejects.toThrow('Route matcher error');
      expect(mockIsPublicRoute).toHaveBeenCalledWith(mockReq);
    });

    it('should handle undefined auth parameter', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function with undefined auth
      await expect(middlewareFunction(undefined, mockReq)).rejects.toThrow();
    });

    it('should handle undefined req parameter', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function with undefined req
      const result = await middlewareFunction(mockAuth, undefined);
      
      // The middleware handles undefined req gracefully by returning early
      expect(mockIsPublicRoute).not.toHaveBeenCalled();
      expect(mockAuth.protect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle null auth parameter', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function with null auth
      await expect(middlewareFunction(null, mockReq)).rejects.toThrow();
    });

    it('should handle null req parameter', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_valid_key_123';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function with null req
      const result = await middlewareFunction(mockAuth, null);
      
      // The middleware handles null req gracefully by returning early
      expect(mockIsPublicRoute).not.toHaveBeenCalled();
      expect(mockAuth.protect).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('Environment variable edge cases in middleware execution', () => {
    it('should handle environment variable with special characters', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_key_with_special_chars_!@#$%^&*()';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      await middlewareFunction(mockAuth, mockReq);
      
      // Verify that special characters are handled correctly
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockAuth.protect).toHaveBeenCalled();
    });

    it('should handle very long environment variable', async () => {
      const longKey = 'pk_' + 'a'.repeat(1000);
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = longKey;
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      await middlewareFunction(mockAuth, mockReq);
      
      // Verify that long key is handled correctly
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockAuth.protect).toHaveBeenCalled();
    });

    it('should handle environment variable with only pk_', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_';
      
      const mockIsPublicRoute = jest.fn().mockReturnValue(false);
      mockCreateRouteMatcher.mockReturnValue(mockIsPublicRoute);
      
      // Capture the middleware function
      mockClerkMiddleware.mockImplementation((fn) => {
        middlewareFunction = fn;
        return jest.fn();
      });
      
      await import('@/middleware');
      
      // Execute the middleware function
      await middlewareFunction(mockAuth, mockReq);
      
      // Verify that pk_ only is handled correctly
      expect(console.warn).not.toHaveBeenCalled();
      expect(mockAuth.protect).toHaveBeenCalled();
    });
  });

  describe('Module exports and configuration', () => {
    it('should export default middleware function', async () => {
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      mockClerkMiddleware.mockReturnValue(jest.fn());
      
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

    it('should call createRouteMatcher with correct routes', async () => {
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

    it('should call clerkMiddleware with function', async () => {
      mockCreateRouteMatcher.mockReturnValue(jest.fn());
      
      await import('@/middleware');
      
      expect(mockClerkMiddleware).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});
