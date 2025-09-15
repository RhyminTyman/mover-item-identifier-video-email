import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/health(.*)",
  "/api/test(.*)",
  "/api/video(.*)",
  "/_not-found",
]);

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");
};

export default clerkMiddleware(async (auth, req) => {
  // Handle edge cases where req might be undefined or null
  if (!req) {
    console.warn("⚠️ [Middleware] Request is undefined or null, allowing request");
    return NextResponse.next();
  }

  // If Clerk is not configured, allow all requests during build
  if (!isClerkConfigured()) {
    console.warn("⚠️ [Middleware] Clerk not configured, allowing all requests");
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next|_not-found|_error).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};
