"use client";

import { useEffect } from 'react';
import { resetApp } from '@/app/actions/state-actions';

export default function StateReset() {
  useEffect(() => {
    // Reset app state on page load
    resetApp().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
}
