"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    </ClerkProvider>
  );
}
