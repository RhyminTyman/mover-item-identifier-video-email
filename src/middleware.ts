import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Keep this list minimal and justify every entry - anything here is reachable
// by anonymous callers on the public internet.
//
// Removed:
//   /api/test(.*)        - no such route exists.
//   /api/video(.*)       - carried an unauthenticated SSRF probe and a video
//                          upload handler that shelled out to ffmpeg. All real
//                          callers are signed-in app flows.
//   /api/items(.*)       - exposed the item catalogue and the per-item
//                          mutation endpoints to anonymous callers.
//   /test-autocomplete   - a development scratch page.
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // Svix signature-verified
  "/api/health(.*)",   // uptime probes; must not disclose internals
  "/_not-found",
]);

// Inbound webhooks are authenticated by their signature and arrive without an
// Origin header, so they are exempt from the cross-origin check below.
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Reject cross-origin state-changing API requests.
 *
 * Clerk's session cookie is SameSite=Lax, which already blocks most CSRF, and
 * Server Actions carry their own origin check - but plain route handlers had
 * neither. src/lib/csrf.ts existed for this and was never imported; it cannot
 * be used here because it pulls in node:crypto, which the edge middleware
 * runtime does not provide, so the check is implemented with Web APIs only.
 *
 * A browser always sends Origin on a cross-origin state-changing request, so
 * comparing it when present is sufficient to stop CSRF. Requests with neither
 * Origin nor Referer are non-browser clients (curl, server-to-server) that
 * cannot be induced to forge a user's cookies, and are allowed through.
 */
function isCrossOriginWrite(req: Request): boolean {
  if (!UNSAFE_METHODS.has(req.method)) return false;

  const host = req.headers.get("host");
  if (!host) return false;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host !== host;
    } catch {
      return true; // unparseable Origin
    }
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host !== host;
    } catch {
      return true;
    }
  }

  return false;
}

export default clerkMiddleware(async (auth, req) => {
  if (!isWebhookRoute(req) && isCrossOriginWrite(req)) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
