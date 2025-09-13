"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Use a placeholder key for build time if no key is provided
  const clerkKey = publishableKey || "pk_test_placeholder";
  
  if (!publishableKey) {
    console.warn("⚠️ [Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in environment variables");
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
    >
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    </ClerkProvider>
  );
}
