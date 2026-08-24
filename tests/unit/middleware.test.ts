/**
 * Behavioural tests for src/middleware.ts.
 *
 * This replaces four earlier "100 percent coverage" suites (~1,260 lines) that
 * asserted against an implementation which no longer exists - a Clerk-not-
 * configured fallback branch that was deleted - and otherwise only checked that
 * the module exported something. None of them tested the property that actually
 * matters: a public route must not be forced through auth.protect(), and every
 * other route must be.
 */

const protectMock = jest.fn();

// Capture every route list handed to createRouteMatcher, and drive matching
// with the real semantics we care about (prefix/wildcard) rather than a stub
// that always returns the same answer. The module builds two matchers - the
// public-route list first, then the webhook exemption.
let capturedRouteLists: string[][] = [];
const publicRoutes = () => capturedRouteLists[0] ?? [];

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      __response: true,
      body,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((callback: unknown) => callback),
  createRouteMatcher: jest.fn((routes: string[]) => {
    capturedRouteLists.push(routes);
    const patterns = routes.map(
      (r) => new RegExp('^' + r.replace(/\(\.\*\)/g, '.*').replace(/\//g, '\\/') + '$')
    );
    return (req: { url: string }) => {
      const path = new URL(req.url).pathname;
      return patterns.some((p) => p.test(path));
    };
  }),
}));

// Clerk v6 hands the callback an `auth` helper that is callable AND carries
// .protect(); src/middleware.ts uses the latter.
type AuthHelper = (() => unknown) & { protect: jest.Mock };

type MiddlewareFn = (auth: AuthHelper, req: { url: string }) => Promise<unknown>;

async function loadMiddleware() {
  const mod = await import('@/middleware');
  return mod as unknown as { default: MiddlewareFn; config: { matcher: string[] } };
}

// The API branch calls auth() and reads userId; the page branch calls
// auth.protect(). Pass a userId to simulate a signed-in caller.
function makeAuthStub(userId: string | null = null): AuthHelper {
  const fn = (() => ({ userId })) as AuthHelper;
  fn.protect = protectMock;
  return fn;
}
type ReqInit = { method?: string; origin?: string; referer?: string; host?: string };

const reqFor = (path: string, init: ReqInit = {}) => {
  const host = init.host ?? 'example.com';
  const headers = new Map<string, string>([['host', host]]);
  if (init.origin) headers.set('origin', init.origin);
  if (init.referer) headers.set('referer', init.referer);
  return {
    url: `https://${host}${path}`,
    method: init.method ?? 'GET',
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
  };
};

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Do NOT reset capturedRouteLists here: createRouteMatcher runs once at
    // module load and the module is cached across tests, so clearing it would
    // leave nothing to assert against.
  });

  describe('public routes bypass authentication', () => {
    const publicPaths = [
      '/sign-in',
      '/sign-in/factor-one',
      '/sign-up',
      '/api/webhooks/clerk',
      '/api/health',
      '/api/health/redis',
      '/_not-found',
    ];

    it.each(publicPaths)('does not protect %s', async (path) => {
      const { default: middleware } = await loadMiddleware();
      await middleware(makeAuthStub(), reqFor(path));
      expect(protectMock).not.toHaveBeenCalled();
    });
  });

  describe('protected pages send anonymous visitors to sign-in', () => {
    const pagePaths = [
      '/',
      '/dashboard',
      '/inventories',
      '/inventories/abc123',
      '/admin',
      '/admin/users',
      '/account',
    ];

    it.each(pagePaths)('protects %s', async (path) => {
      const { default: middleware } = await loadMiddleware();
      await middleware(makeAuthStub(), reqFor(path));
      expect(protectMock).toHaveBeenCalledTimes(1);
    });

    it('passes an explicit unauthenticatedUrl so the fallback is not a 404', async () => {
      const { default: middleware } = await loadMiddleware();
      await middleware(makeAuthStub(), reqFor('/dashboard'));

      // Without this, auth.protect() cannot always resolve the sign-in route
      // and falls back to notFound() - every protected page then answered
      // anonymous requests with a bare 404 instead of a sign-in prompt.
      expect(protectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          unauthenticatedUrl: 'https://example.com/sign-in',
        })
      );
    });
  });

  describe('protected API routes answer 401 rather than redirecting', () => {
    const apiPaths = [
      '/api/inventories',
      '/api/inventories/abc123',
      '/api/analyze',
      '/api/admin/users',
      '/api/s3/sign',
      '/api/user/delete-account',
      '/api/items/abc123',
      '/api/items/autocomplete',
      '/api/video/frames',
      '/api/video/extract-frames',
    ];

    it.each(apiPaths)('%s returns 401 when unauthenticated', async (path) => {
      const { default: middleware } = await loadMiddleware();
      const res = (await middleware(makeAuthStub(), reqFor(path))) as {
        status: number;
        body: unknown;
      };

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Unauthorized' });
      // A redirect to an HTML sign-in page is unusable by an API client, so
      // protect() must not be what handles these.
      expect(protectMock).not.toHaveBeenCalled();
    });

    it.each(apiPaths)('%s passes through when authenticated', async (path) => {
      const { default: middleware } = await loadMiddleware();
      const res = await middleware(makeAuthStub('user_123'), reqFor(path));

      expect(res).toBeUndefined();
      expect(protectMock).not.toHaveBeenCalled();
    });
  });

  describe('public route list', () => {
    it('is limited to the routes that are intentionally unauthenticated', async () => {
      await loadMiddleware();
      // Guard against a route being made public by accident. Update this list
      // deliberately, and only after confirming the endpoint is safe to expose.
      expect(new Set(publicRoutes())).toEqual(
        new Set([
          '/sign-in(.*)',
          '/sign-up(.*)',
          '/api/webhooks(.*)',
          '/api/health(.*)',
          '/_not-found',
        ])
      );
    });

    it('does not expose the video endpoints', async () => {
      await loadMiddleware();
      // /api/video(.*) was public and carried an unauthenticated SSRF probe and
      // a shell-injecting ffmpeg upload handler. It must stay authenticated.
      expect(publicRoutes()).not.toContain('/api/video(.*)');
    });
  });

  describe('cross-origin write protection', () => {
    it('blocks a POST from a foreign origin', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = (await middleware(
        makeAuthStub(),
        reqFor('/api/inventories', { method: 'POST', origin: 'https://evil.example' })
      )) as { status: number };

      expect(res.status).toBe(403);
      // Blocked before authentication is even consulted.
      expect(protectMock).not.toHaveBeenCalled();
    });

    it.each(['PUT', 'PATCH', 'DELETE'])('blocks a cross-origin %s', async (method) => {
      const { default: middleware } = await loadMiddleware();
      const res = (await middleware(
        makeAuthStub(),
        reqFor('/api/inventories/abc', { method, origin: 'https://evil.example' })
      )) as { status: number };

      expect(res.status).toBe(403);
    });

    it('allows a same-origin POST', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = await middleware(
        makeAuthStub('user_123'),
        reqFor('/api/inventories', { method: 'POST', origin: 'https://example.com' })
      );

      expect(res).toBeUndefined();
    });

    it('does not block cross-origin GETs', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = await middleware(
        makeAuthStub('user_123'),
        reqFor('/api/inventories', { method: 'GET', origin: 'https://evil.example' })
      );

      expect(res).toBeUndefined();
    });

    it('exempts signature-verified webhooks, which arrive without an Origin', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = await middleware(
        makeAuthStub(),
        reqFor('/api/webhooks/clerk', { method: 'POST', referer: 'https://svix.example' })
      );

      expect(res).toBeUndefined();
    });

    it('allows non-browser clients that send neither Origin nor Referer', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = await middleware(
        makeAuthStub('user_123'),
        reqFor('/api/inventories', { method: 'POST' })
      );

      expect(res).toBeUndefined();
    });

    it('falls back to Referer when Origin is absent', async () => {
      const { default: middleware } = await loadMiddleware();
      const res = (await middleware(
        makeAuthStub(),
        reqFor('/api/inventories', { method: 'POST', referer: 'https://evil.example/page' })
      )) as { status: number };

      expect(res.status).toBe(403);
    });
  });

  describe('config', () => {
    it('exports a matcher covering app routes and the api namespace', async () => {
      const { config } = await loadMiddleware();
      expect(Array.isArray(config.matcher)).toBe(true);
      expect(config.matcher).toContain('/');
      expect(config.matcher).toContain('/(api|trpc)(.*)');
    });
  });
});
