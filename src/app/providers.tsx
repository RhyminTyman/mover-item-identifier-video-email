"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn("⚠️ [Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in environment variables");
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production environment");
    }
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey || "pk_test_placeholder"}
    >
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    </ClerkProvider>
  );
}
