import { test, expect } from '@playwright/test'

/**
 * The authorization boundary, exercised as an anonymous visitor.
 *
 * This is deliberately the whole of the e2e suite for now. The previous specs
 * asserted against signed-in UI, but faked the session with
 *
 *   localStorage.setItem('clerk-session', JSON.stringify({ user: {...} }))
 *
 * which does nothing: a Clerk session is a signed JWT in an HttpOnly cookie,
 * verified server-side in middleware. Those tests navigated to a protected
 * route, were redirected to sign-in, and then asserted on text that had never
 * rendered - so they could not pass regardless of configuration.
 *
 * Signing in for real needs @clerk/testing (clerkSetup +
 * setupClerkTestingToken) and a seeded test user per role. Until that exists,
 * these tests cover the properties that are both reachable anonymously and
 * genuinely worth locking down.
 */

const PROTECTED_PAGES = ['/', '/dashboard', '/inventories', '/account', '/admin', '/admin/crm']

const PROTECTED_APIS = [
  '/api/inventories',
  '/api/addresses',
  '/api/admin/users',
  '/api/items/autocomplete',
]

const PUBLIC_ROUTES = ['/sign-in', '/api/health']

test.describe('anonymous visitors', () => {
  for (const path of PROTECTED_PAGES) {
    test(`${path} redirects to sign-in`, async ({ page }) => {
      const response = await page.goto(path)

      // Landing on the sign-in page is the requirement. A 404 here is the
      // regression this guards: auth.protect() without an explicit
      // unauthenticatedUrl falls back to notFound(), so anonymous visitors got
      // a bare 404 instead of a sign-in prompt.
      expect(page.url()).toContain('/sign-in')
      expect(response?.status(), 'should not 404').not.toBe(404)
    })
  }

  for (const path of PROTECTED_APIS) {
    test(`${path} returns 401, not a redirect to HTML`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 })

      expect(response.status()).toBe(401)

      // An API answering with an HTML sign-in page is unusable by any client.
      const contentType = response.headers()['content-type'] ?? ''
      expect(contentType).toContain('application/json')
    })
  }

  for (const path of PUBLIC_ROUTES) {
    test(`${path} is reachable`, async ({ request }) => {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
    })
  }
})

test.describe('sign-in page', () => {
  test('renders the Clerk widget', async ({ page }) => {
    await page.goto('/sign-in')
    // Clerk renders an email field; assert on role rather than a Clerk-internal
    // class name so a Clerk upgrade does not break this.
    await expect(
      page.getByRole('textbox').first(),
    ).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('health endpoint', () => {
  test('reports status and environment validity', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('status')

    // Must not leak configuration values - only whether they are present.
    const serialized = JSON.stringify(body)
    expect(serialized).not.toMatch(/sk-proj-|sk_test_|sk_live_|postgres(ql)?:\/\//)
  })
})

test.describe('CSRF protection', () => {
  test('cross-origin state-changing request is blocked', async ({ request }) => {
    const response = await request.post('/api/inventories', {
      headers: { origin: 'https://attacker.example' },
      data: {},
      maxRedirects: 0,
    })

    // 403 from the middleware's cross-origin check. 401 is also acceptable -
    // it means auth rejected the call first. Either way it must not succeed.
    expect([401, 403]).toContain(response.status())
  })

  test('same-origin request is not blocked by the origin check', async ({ request, baseURL }) => {
    const response = await request.post('/api/inventories', {
      headers: { origin: baseURL! },
      data: {},
      maxRedirects: 0,
    })

    // Should fail on auth (401), not on the origin check (403) - proving the
    // check is not simply rejecting everything.
    expect(response.status()).toBe(401)
  })
})
