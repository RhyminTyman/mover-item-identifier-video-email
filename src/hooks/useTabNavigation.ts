"use client";

import { useTransition } from 'react';
import { setActiveTab as setActiveTabAction } from '@/app/actions/state-actions';

export function useTabNavigation() {
  const [isPending, startTransition] = useTransition();

  const switchTab = (tab: 'analyze' | 'inventories') => {
    startTransition(async () => {
      try {
        await setActiveTabAction(tab);
      } catch (error) {
        console.error('Error switching tab:', error);
        // Fallback to window.location for critical navigation
        if (tab === 'inventories') {
          window.location.href = '/?tab=inventories';
        } else {
          window.location.href = '/?tab=analyze';
        }
      }
    });
  };

  return { switchTab, isPending };
}
