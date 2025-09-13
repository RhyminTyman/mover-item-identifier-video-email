import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/_not-found",
]);

// Check if Clerk is properly configured
const isClerkConfigured = () => {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_placeholder";
};

export default clerkMiddleware(async (auth, req) => {
  // If Clerk is not configured, allow all requests during build
  if (!isClerkConfigured()) {
    console.warn("⚠️ [Middleware] Clerk not configured, allowing all requests");
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next|_not-found|_error).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};
