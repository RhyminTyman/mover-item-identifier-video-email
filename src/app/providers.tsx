"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeRegistry } from "./theme/ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeRegistry>
        {children}
      </ThemeRegistry>
    </ClerkProvider>
  );
}
