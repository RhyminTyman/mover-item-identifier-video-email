/**
 * Reusable loading state components
 * Provides consistent loading UX across the app
 */

"use client";

import { Box, CircularProgress, Typography, Skeleton, Card, CardContent, Grid } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: number;
}

/**
 * Standard loading spinner with optional message
 */
export function LoadingState({ message, fullScreen = false, size = 40 }: LoadingStateProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        {content}
      </Box>
    );
  }

  return (
    <Box py={4}>
      {content}
    </Box>
  );
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} display="flex" gap={2} mb={2}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="100%" height={40} />
          ))}
        </Box>
      ))}
    </>
  );
}

/**
 * Skeleton loader for cards
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="rectangular" height={140} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="80%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="60%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} display="flex" alignItems="center" gap={2} mb={2} p={2}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box flex={1}>
            <Skeleton variant="text" height={24} width="60%" sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} width="40%" />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Skeleton loader for form
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Box>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={index} mb={3}>
          <Skeleton variant="text" height={20} width="30%" sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Inline loading indicator (for buttons)
 */
export function InlineLoader({ size = 20 }: { size?: number }) {
  return <CircularProgress size={size} />;
}

/**
 * Progress bar loader
 */
export function ProgressLoader({ 
  value, 
  message 
}: { 
  value: number; 
  message?: string 
}) {
  return (
    <Box width="100%" textAlign="center">
      <Box display="flex" alignItems="center" gap={2} mb={1}>
        <Box 
          flex={1} 
          height={8} 
          bgcolor="grey.200" 
          borderRadius={4}
          overflow="hidden"
        >
          <Box
            height="100%"
            bgcolor="primary.main"
            width={`${value}%`}
            sx={{ transition: 'width 0.3s ease' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" minWidth={50}>
          {value}%
        </Typography>
      </Box>
      {message && (
        <Typography variant="caption" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Shimmer effect loader
 */
export function ShimmerLoader({ width = '100%', height = 200 }: { width?: string | number; height?: number }) {
  return (
    <Box
      sx={{
        width,
        height,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 1,
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      }}
    />
  );
}

