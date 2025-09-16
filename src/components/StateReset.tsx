"use client";

import { useEffect, useState } from 'react';
import { resetApp } from '@/app/actions/state-actions';

export default function StateReset() {
  const [hasReset, setHasReset] = useState(false);

  useEffect(() => {
    // Only reset once per session
    if (!hasReset) {
      resetApp()
        .then(() => setHasReset(true))
        .catch((error) => {
          console.error('Failed to reset app state:', error);
          setHasReset(true); // Don't retry on error
        });
    }
  }, [hasReset]);

  return null; // This component doesn't render anything
}
