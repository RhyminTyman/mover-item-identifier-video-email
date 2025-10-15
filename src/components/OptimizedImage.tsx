/**
 * Optimized Image Component
 * Uses Next.js Image with automatic optimization and lazy loading
 */

"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';
import { useIsMobile } from './MobileOptimized';
import { isSlowConnection } from '@/lib/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
  onClick?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality,
  objectFit = 'cover',
  className,
  onClick
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMobile = useIsMobile();
  const isSlowConn = isSlowConnection();

  // Adaptive quality based on device and connection
  const adaptiveQuality = quality || (isSlowConn ? 50 : isMobile ? 70 : 85);

  // Handle image load
  const handleLoad = () => {
    setLoading(false);
  };

  // Handle image error
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <Box
        sx={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.200',
          color: 'text.secondary',
          borderRadius: 1
        }}
      >
        Failed to load image
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      {loading && (
        <Skeleton
          variant="rectangular"
          width={fill ? '100%' : width}
          height={fill ? '100%' : height}
          sx={{
            position: fill ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={adaptiveQuality}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{
          objectFit,
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        sizes={
          isMobile
            ? '100vw'
            : fill
            ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            : undefined
        }
      />
    </Box>
  );
}

/**
 * Optimized thumbnail component
 */
export function OptimizedThumbnail({
  src,
  alt,
  size = 100,
  onClick
}: {
  src: string;
  alt: string;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={60}
      objectFit="cover"
      onClick={onClick}
    />
  );
}

/**
 * Optimized gallery image
 */
export function OptimizedGalleryImage({
  src,
  alt,
  onClick
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        paddingBottom: '75%', // 4:3 aspect ratio
        overflow: 'hidden',
        borderRadius: 1
      }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        onClick={onClick}
      />
    </Box>
  );
}

