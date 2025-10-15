"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeRegistry } from "./theme/ThemeRegistry";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));
  
  if (!publishableKey) {
    console.warn("⚠️ [Clerk] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found in environment variables");
    console.warn("⚠️ [Clerk] Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file");
    // Return a simple wrapper without Clerk during build
    return (
      <ThemeRegistry>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Clerk Configuration Missing
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Please set <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file.
                    </p>
                    <p className="mt-2">
                      Get your keys from the <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-yellow-800 underline">Clerk Dashboard</a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ThemeRegistry>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined, // Will use system theme
        elements: {
          formButtonPrimary: 
            'bg-[#28c2a0] hover:bg-[#1ea085] text-white',
          footerActionLink: 'text-[#28c2a0] hover:text-[#1ea085]',
          card: 'dark:bg-[#1e293b] dark:text-white',
          headerTitle: 'dark:text-white',
          headerSubtitle: 'dark:text-gray-300',
          socialButtonsBlockButton: 
            'dark:bg-[#334155] dark:hover:bg-[#475569] dark:text-white dark:border-[#475569]',
          formFieldInput: 
            'dark:bg-[#334155] dark:border-[#475569] dark:text-white',
          formFieldLabel: 'dark:text-gray-300',
          identityPreviewText: 'dark:text-white',
          identityPreviewEditButton: 'dark:text-[#28c2a0]',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
