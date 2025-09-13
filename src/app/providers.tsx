"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn("⚠️ [Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in environment variables");
    // Return a simple wrapper without Clerk during build
    return (
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
    >
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    </ClerkProvider>
  );
}
