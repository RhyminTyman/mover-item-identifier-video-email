/**
 * Mobile-optimized wrapper component
 * Provides touch-friendly interactions and mobile-specific optimizations
 */

"use client";

import { ReactNode, useEffect, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface MobileOptimizedProps {
  children: ReactNode;
  touchFriendly?: boolean;
  swipeEnabled?: boolean;
}

export function MobileOptimized({ 
  children, 
  touchFriendly = true,
  swipeEnabled = false 
}: MobileOptimizedProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      // Emit custom event for swipe
      const event = new CustomEvent('swipe', {
        detail: { direction: isLeftSwipe ? 'left' : 'right' }
      });
      window.dispatchEvent(event);
    }
  };

  useEffect(() => {
    // Disable pull-to-refresh on mobile
    if (isMobile) {
      document.body.style.overscrollBehavior = 'none';
    }

    return () => {
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [isMobile]);

  const touchProps = swipeEnabled ? {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } : {};

  return (
    <Box
      sx={{
        // Touch-friendly tap targets (minimum 44x44px)
        ...(touchFriendly && isMobile && {
          '& button, & a, & [role="button"]': {
            minHeight: '44px',
            minWidth: '44px',
          },
          // Larger touch targets for interactive elements
          '& input, & select, & textarea': {
            minHeight: '44px',
          },
          // Prevent text selection on double-tap
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          // Smooth scrolling
          WebkitOverflowScrolling: 'touch',
        })
      }}
      {...touchProps}
    >
      {children}
    </Box>
  );
}

/**
 * Hook to detect mobile device
 */
export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  return isTouch;
}

/**
 * Hook for viewport dimensions
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

/**
 * Optimize image loading for mobile
 */
export function getMobileImageQuality(isMobile: boolean, isSlowConnection: boolean): number {
  if (isSlowConnection) return 50;
  if (isMobile) return 70;
  return 90;
}

/**
 * Get appropriate image size for device
 */
export function getResponsiveImageSize(isMobile: boolean): { width: number; height: number } {
  if (isMobile) {
    return { width: 800, height: 600 };
  }
  return { width: 1920, height: 1080 };
}

